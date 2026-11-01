#!/usr/bin/env python3
"""QB-54 dead-code scanner for ai-interview-os.
Outputs a seed inventory of dead-code candidates. Evidence-only: every finding
lists the exact reference counts so claims can be re-verified by anyone.
Usage: python3 scripts/dead-code-scan.py [--root /path/to/repo]
"""
import json
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root (scripts/ parent)
FE = os.path.join(ROOT, "frontend", "src")
JAVA_MODULES = [
    "api-gateway-service", "ai-orchestrator-service", "evaluation-report-service",
    "interview-session-service", "proctor-sentinel-service", "question-bank-service",
]

def read(p):
    try:
        with open(p, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""

def walk(exts, base):
    out = []
    for dirpath, _dirs, files in os.walk(base):
        if any(x in dirpath for x in ("/node_modules/", "/target/", "/dist/", "/.git/")):
            continue
        for fn in files:
            if fn.endswith(exts):
                out.append(os.path.join(dirpath, fn))
    return out

# ---------- 1. Frontend orphan analysis ----------
def fe_scan():
    files = [f for f in walk((".ts", ".tsx"), FE)]
    srcs = {f: read(f) for f in files}
    rel = {f: os.path.relpath(f, ROOT) for f in files}

    # exported symbols per file
    exp_re = re.compile(r"^export\s+(?:async\s+)?(?:function|const|class|interface|type|enum)\s+([A-Za-z0-9_]+)", re.M)
    exports = {}  # file -> [symbols]
    for f, s in srcs.items():
        exports[f] = exp_re.findall(s)

    def refcount(sym, own):
        n = 0
        pat = re.compile(r"\b" + re.escape(sym) + r"\b")
        for f, s in srcs.items():
            if f == own:
                continue
            n += len(pat.findall(s))
        return n

    ENTRY_POINTS = {"main.tsx", "App.tsx", "index.ts", "index.tsx"}
    whole_orphans, sym_orphans = [], []
    for f in files:
        base = os.path.basename(f)
        if base.endswith(".test.ts") or base.endswith(".test.tsx") or base in ENTRY_POINTS:
            continue
        name = base.rsplit(".", 1)[0]
        # whole-file import references (by module name)
        pat = re.compile(r"['\"]\.{0,2}/[^'\"]*" + re.escape(name) + r"['\"]")
        importers = [rel[g] for g in files if g != f and pat.search(srcs[g])]
        if not importers and not base.endswith((".d.ts",)):
            whole_orphans.append(rel[f])
        for sym in exports[f]:
            if refcount(sym, f) == 0:
                kind = "TYPE" if sym[0].islower() is False and re.search(
                    r"^export\s+(interface|type)\s+" + re.escape(sym), srcs[f]) else "VALUE"
                sym_orphans.append((rel[f], sym, kind))
    return files, whole_orphans, sym_orphans, rel

# ---------- 2. Java orphan analysis ----------
SPRING_ALIVE = ("@RestController", "@Controller", "@Service", "@Repository",
                "@Component", "@Configuration", "@Entity", "@SpringBootApplication",
                "@ConfigurationProperties", "@FeignClient", "@ControllerAdvice",
                "@RestControllerAdvice", "@Mapper", "@Advisor")

def java_scan():
    mains, tests = [], []
    for m in JAVA_MODULES:
        jd = os.path.join(ROOT, m, "src", "main", "java")
        td = os.path.join(ROOT, m, "src", "test", "java")
        if os.path.isdir(jd):
            mains += walk((".java",), jd)
        if os.path.isdir(td):
            tests += walk((".java",), td)
    srcs = {f: read(f) for f in mains + tests}
    cls_re = re.compile(r"(?:public\s+)?(?:final\s+|abstract\s+)*(?:class|interface|enum|record)\s+([A-Za-z0-9_]+)")
    junit_instantiated = re.compile(r"@(Test|ParameterizedTest|SpringBootTest|TestConfiguration)")
    # symbol -> all files defining it
    defs = defaultdict(list)
    for f, s in srcs.items():
        m = cls_re.search(s)
        if m:
            defs[m.group(1)].append(f)

    def refcount(sym, own):
        pat = re.compile(r"\b" + re.escape(sym) + r"\b")
        n = 0
        for f, s in srcs.items():
            if f == own:
                continue
            n += len(pat.findall(s))
        return n

    prod_dead, test_only_live = [], []
    for sym, dfs in defs.items():
        f = dfs[0]
        rel = os.path.relpath(f, ROOT)
        s = srcs[f]
        if "/src/test/java/" in f:
            continue  # JUnit instantiates test classes reflectively — never prod-dead
        if any(a in s.split("{")[0] for a in SPRING_ALIVE):
            continue  # runtime-instantiated via component scan
        rc_main = sum(len(re.findall(r"\b" + re.escape(sym) + r"\b", srcs[g]))
                      for g in srcs if g != f and "/src/main/java/" in g)
        rc_test = sum(len(re.findall(r"\b" + re.escape(sym) + r"\b", srcs[g]))
                      for g in srcs if g != f and "/src/test/java/" in g)
        if rc_main == 0 and rc_test == 0:
            prod_dead.append(rel)
        elif rc_main == 0 and rc_test > 0:
            test_only_live.append((rel, rc_test))
    return prod_dead, test_only_live

# ---------- 3. Endpoint three-way diff ----------
def endpoint_scan():
    ctl = {}
    for m in JAVA_MODULES:
        for f in walk((".java",), os.path.join(ROOT, m, "src", "main", "java")):
            s = read(f)
            if "@RestController" not in s and "@Controller" not in s:
                continue
            base = re.search(r"@RequestMapping\(\"([^\"]+)\"\)", s)
            bpath = base.group(1) if base else ""
            methods = re.findall(r"@(Get|Post|Put|Delete|Patch)Mapping(?:\(\"([^\"]*)\"\))?", s)
            paths = {f"{bpath}{'/' + mm[1] if mm[1] else ''}": mm[0] for mm in methods} or ({bpath: "GET"} if bpath else {})
            ctl[os.path.relpath(f, ROOT)] = paths
    fe_src = "".join(read(f) for f in walk((".ts", ".tsx"), FE))
    fe_paths = set(re.findall(r"[\"'](/api/v1[^\"']*)[\"']", fe_src))
    fe_norm = {re.sub(r"\$\{[^}]*\}", "*", p) for p in fe_paths}
    return ctl, fe_norm

# ---------- 4. FE dependency usage ----------
def dep_scan():
    pkg = json.loads(read(os.path.join(ROOT, "frontend", "package.json")) or "{}")
    deps = pkg.get("dependencies", {})
    all_src = "".join(read(f) for f in walk((".ts", ".tsx", ".css"), FE))
    unused = []
    for d in deps:
        short = d.split("/")[-1]
        if not re.search(r"[\"']" + re.escape(d) + r"[\"']|from\s+[\"']" + re.escape(d), all_src) \
           and short not in all_src:
            unused.append(d)
    return deps, unused

# ---------- 5. Markers + inventories ----------
def misc_scan():
    counts = defaultdict(int)
    for f in walk((".java", ".ts", ".tsx"), ROOT):
        s = read(f)
        for marker in ("TODO", "FIXME", "XXX", "HACK", "@Deprecated"):
            counts[marker] += len(re.findall(r"\b" + marker + r"\b", s))
    inv = {}
    for d in ("scripts", "docs", "judge0-patches", "collab"):
        p = os.path.join(ROOT, d)
        inv[d] = sorted(os.listdir(p)) if os.path.isdir(p) else []
    return counts, inv

def main():
    fe_files, whole_orphans, sym_orphans, rel = fe_scan()
    print("== 1. FRONTEND ==")
    print(f"files scanned: {len(fe_files)}")
    print(f"WHOLE-FILE ORPHANS (never imported): {len(whole_orphans)}")
    for p in whole_orphans:
        print("  ", p)
    strong = [x for x in sym_orphans if x[2] == "VALUE"]
    weak = [x for x in sym_orphans if x[2] == "TYPE"]
    print(f"EXPORTED-SYMBOL ORPHANS — VALUE (fn/component/const never referenced elsewhere): {len(strong)}")
    for p, s, k in strong[:40]:
        print(f"   {p} :: {s}")
    if len(strong) > 40:
        print(f"   ... +{len(strong)-40} more")
    print(f"EXPORTED-SYMBOL ORPHANS — TYPE (unused exported interface/type): {len(weak)}")
    for p, s, k in weak[:20]:
        print(f"   {p} :: {s}")
    if len(weak) > 20:
        print(f"   ... +{len(weak)-20} more")

    pd, tol = java_scan()
    print("\n== 2. JAVA ==")
    print(f"PROD-DEAD CLASSES (no main AND no test refs): {len(pd)}")
    for p in pd:
        print("  ", p)
    print(f"TEST-ONLY-LIVE CLASSES (no prod refs, cited by tests): {len(tol)}")
    for p, n in tol:
        print(f"   {p} (test refs: {n})")

    ctl, fe_paths = endpoint_scan()
    print("\n== 3. ENDPOINT THREE-WAY ==")
    all_be = set()
    for c, paths in sorted(ctl.items()):
        for p in paths:
            all_be.add(p)
        unreferenced = [p for p in paths
                        if not any(p == fp or fp.rstrip("*") and p.startswith(fp.rstrip("*")) for fp in fe_paths)]
        if unreferenced:
            print(f"  {c}: NO direct FE caller -> {unreferenced}")
    print(f"  backend endpoints total: {len(all_be)} | FE-called paths: {len(fe_paths)}")

    deps, unused = dep_scan()
    print("\n== 4. FRONTEND DEPS ==")
    print(f"declared: {len(deps)} | unused candidates: {unused}")

    counts, inv = misc_scan()
    print("\n== 5. MARKERS ==", dict(counts))
    print("\n== 6. INVENTORY ==")
    for d, items in inv.items():
        print(f"  {d}/ ({len(items)}): {', '.join(items[:14])}{' ...' if len(items) > 14 else ''}")

if __name__ == "__main__":
    main()
