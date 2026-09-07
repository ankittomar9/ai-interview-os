# Judge0 Sandbox Compatibility Patch

## 1. Upstream Base
- **Base Docker Image**: `judge0/judge0:1.13.1`
- **Target File**: `/api/app/jobs/isolate_job.rb`
- **Mount Location**: `./judge0-patches/isolate_job.rb:/api/app/jobs/isolate_job.rb:ro`
- **Affected Services**: Mounted to both `judge0` (Puma API server) and `judge0-workers` (Resque workers) in `docker-compose.yaml`.

---

## 2. Root Cause & Divergences

### A. Dynamic Cgroup v2 Support
- **Problem**: Modern WSL2 and Linux kernel distributions enforce unified **cgroup v2** (`/sys/fs/cgroup`). Upstream Judge0 1.13.1 defaults to passing `--cg` to `isolate` unless per-process time and memory limits are both set. `isolate --cg` strictly looks for the cgroup v1 memory controller `/sys/fs/cgroup/memory`. On cgroup v2 systems, `isolate --init` fails (`Failed to create control group /sys/fs/cgroup/memory/box-X/: No such file or directory`), resulting in an empty `@workdir` and an unhandled `Errno::ENOENT: No such file or directory @ rb_sysopen - /box/Main.java` (Status 13 / Boxerr).
- **Patch Divergence (Lines 57-58)**:
  ```ruby
  has_cgroup_v1 = File.directory?("/sys/fs/cgroup/memory")
  @cgroups = (has_cgroup_v1 && (!submission.enable_per_process_and_thread_time_limit || !submission.enable_per_process_and_thread_memory_limit)) ? "--cg" : ""
  ```
  `isolate` operates cleanly via user namespaces and chroot without requiring deprecated cgroup v1 emulation flags.

### B. JVM Virtual Address Space Protection (`-m`)
- **Problem**: In non-cgroup mode, `isolate` passes `-m <limit_kb>` to enforce memory limits via `setrlimit(RLIMIT_AS)` (virtual address space). The 64-bit HotSpot JVM reserves over 1GB of address space on boot (metaspace, heap, compressed OOPs). Passing `-m 256000` causes OpenJDK to abort with `Could not reserve enough space for 256000KB object heap`.
- **Patch Divergence (Lines 133-138, 212-218)**:
  ```ruby
  is_jvm = ["java", "kotlin", "clojure", "groovy", "scala"].any? { |l| submission.language&.name&.to_s&.downcase&.include?(l) }
  mem_flag = ""
  if cgroups.present?
    mem_flag = "--cg-mem=#{...}"
  elsif submission.enable_per_process_and_thread_memory_limit && !is_jvm
    mem_flag = "-m #{...}"
  end
  ```
  `-m` is suppressed for JVM runtimes while physical memory is enforced at the container level (`mem_limit: 768m` in `docker-compose.yaml`).

### C. Security & Port Binding
- The Judge0 API port is mapped strictly to `127.0.0.1:2358:2358` to ensure unauthenticated code execution cannot be reached over the local network / Wi-Fi.

---

## 3. Resource & Concurrency Considerations
- **Memory Ceiling (L1)**: Because `-m` is bypassed for JVM runtimes, individual JVM processes are bounded by the container memory limit (768MB). For personal practice and playground environments, this is completely safe and appropriate. In a high-concurrency multi-tenant setting, an unbounded JVM memory loop could cause the container OOM killer to terminate neighboring worker tasks. A production multi-tenant deployment should migrate to an isolate version with native cgroup v2 support or use isolated per-job containers.
- **Verified Language Matrix**:
  - Java (ID 62): OpenJDK 13.0.1 — Passed (2/2)
  - Python (ID 71): Python 3.8.1 — Passed (2/2)
  - JavaScript (ID 63): Node.js 12.14.0 — Passed (2/2, ~28MB RSS)
  - C++ (ID 54): GCC 9.2.0 — Passed (2/2, ~3MB RSS)

---

## 4. Upgrade Guide
When upgrading `judge0/judge0` to a newer image version:
1. Check if the upstream version natively supports Linux cgroup v2 unified hierarchy (`isolate --cg` with cgroup v2 controller delegation).
2. If native cgroup v2 is supported, retire this patch and remove the volume mount from `docker-compose.yaml`.
3. If still targeting cgroup v1, inspect `/api/app/jobs/isolate_job.rb` in the new image and re-apply the two divergences described in Section 2.
