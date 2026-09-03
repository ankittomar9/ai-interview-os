# Security, Sandboxing & Integrity Architecture

This document details the security model of AI Interview OS, including credential management, sandbox isolation, proctoring safeguards, and data retention hygiene.

---

## 1. BYOK (Bring Your Own Key) Model

AI Interview OS supports zero-persistence API credential management:

```
[Candidate Browser: SetupScreen.tsx]
       │
       ▼ (Key entered into memory; never stored in localStorage)
[HTTP Request Header: X-InterviewOS-Key]
       │
       ▼ (api-gateway-service:8080 forwards to ai-orchestrator-service)
[AiClientFactory.java]
       │
       ├─► Header key present: Used ephemerally for request duration
       └─► Header key absent:  Falls back to server .env / application.yaml key
```

### Security Invariants:
- **Zero Database Persistence**: Candidate API keys are NEVER written to PostgreSQL, MongoDB, or application logs.
- **Header Redaction**: Logging filters explicitly mask the `X-InterviewOS-Key` header in gateway and service logs.
- **Client-Side Hygiene**: The key is maintained solely in React state during active sessions and wiped upon session completion.

---

## 2. Sandbox Container Isolation

To protect the host system from arbitrary code execution attacks:

1. **Judge0 CE (DSA)**:
   - Workers run inside Docker containers with root filesystem read-only locks.
   - Code executes under a restricted non-root user (`uid=1000, gid=1000`).
   - Linux `isolate` restricts memory (256 MB), CPU execution time (15s), process fork counts, and disk space.
   - Workers have outbound network access disabled.
2. **PostgreSQL Ephemeral Schemas (SQL)**:
   - Queries run with `statement_timeout = '10s'`.
   - Dynamic schema names (`session_{id}`) prevent cross-tenant collisions.
   - User database accounts lack superuser privileges and filesystem function access (`COPY ... FROM PROGRAM` is revoked).
3. **Maven Workspaces (LLD)**:
   - Workspaces run in isolated Docker containers mounting a dedicated named volume.
   - Workspace destruction triggers volume pruning.

---

## 3. Proctoring & Integrity Telemetry

Interview sessions enforce four mandatory pre-flight checklist gates in [`PreInterviewChecklist.tsx`](../frontend/src/components/PreInterviewChecklist.tsx):

1. **Primary Camera Gate**: Live WebRTC video feed must be initialized with face centered.
2. **Microphone Gate**: Web Audio API analyser must detect ambient audio levels $>10\%$ before enabling proceed.
3. **Secondary Camera Pairing**: A dynamic QR code pairs a secondary mobile camera for environment inspection; if skipped, a single-camera integrity flag is permanently recorded in the diagnostic report.
4. **Academic Integrity Consent**: Explicit acknowledgement of recording and anti-plagiarism terms.

### Active Proctoring Signals

- **Tab Inactivity Detection**: React tracks window visibility changes (`document.visibilityState`); unfocused durations $>3$ seconds generate high-priority proctoring events.
- **Keystroke Velocity Profiling**: Keystroke intervals are timestamped. Large blocks of code appearing with $0$ typing events trigger copy-paste alerts.

---

## 4. Video Recording Pipeline & 7-Day Retention Hygiene

```
[MediaRecorder (Candidate WebRTC)]
       │
       ▼ (5000ms timeslices / VP8 WebM chunks)
[POST /api/v1/sessions/{id}/recordings/chunk?seq={n}]
       │
       ▼ (interview-session-service:8081)
[SessionRecordingService.java]
       │
       ▼ (Stored in MongoDB GridFS bucket)
[GridFS: rec_{sessionId}_chunk_{seq}.webm]
       │
       ▼ (Playback via DiagnosticReportView.tsx)
[Browser HTML5 Video Player]
```

### Automated 7-Day Storage Hygiene

To maintain GDPR compliance and prevent storage bloat, [`StorageHygieneScheduledJob.java`](../interview-session-service/src/main/java/com/interviewos/session/job/StorageHygieneScheduledJob.java) runs a daily cleanup cron:

```java
@Scheduled(cron = "0 0 2 * * ?") // 02:00 AM daily
public void purgeExpiredRecordings() {
    Instant cutoff = Instant.now().minus(7, ChronoUnit.DAYS);
    log.info("Executing 7-day hygiene cleanup for recordings older than {}", cutoff);
    gridFsTemplate.delete(new Query(Criteria.where("uploadDate").lt(cutoff)));
}
```

---

## ⚠️ DO NOT (Security Constraints)

> [!CAUTION]
> **STRICT SECURITY CONSTRAINTS FOR FUTURE DEVELOPERS AND LLMs:**

1. **Do NOT persist candidate API keys.** Keys must remain in transient HTTP headers and never be committed to disk or database tables.
2. **Do NOT disable pre-interview proctoring gates for Interview mode.** The 4 hard gates protect interview validity.
3. **Do NOT run candidate code with container host networking enabled (`network_mode: host`).** Sandboxes must remain completely isolated from host loopback and internal microservice ports.
4. **Do NOT remove the 7-day automated hygiene retention policy.** Indefinite video storage violates privacy standards and rapidly consumes disk space.
5. **Do NOT grant Docker socket access to untrusted containers.** Only `docker-socket-proxy` may expose Docker management endpoints.
