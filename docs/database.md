# Database Architecture & Polyglot Persistence

AI Interview OS utilizes a polyglot persistence model combining relational PostgreSQL 16 with document/blob MongoDB 7.

---

## 1. Relational Persistence: PostgreSQL 16

PostgreSQL enforces ACID transactions, relational integrity, session lifecycles, and question bank consistency.

```
+------------------------+          +-------------------------+
|   interview_sessions   | 1      * |    session_messages     |
+------------------------+----------+-------------------------+
| id (PK)                |          | id (PK)                 |
| candidate_id           |          | session_id (FK)         |
| role_title             |          | sender_role             |
| track                  |          | message_type            |
| difficulty             |          | content                 |
| session_mode           |          | code_snippet            |
| planned_slugs (ARRAY)  |          | integrity_signals       |
| status                 |          | timestamp               |
| created_at             |          +-------------------------+
| started_at             |
| completed_at           |
+------------------------+
```

### Core Table Definitions

```sql
-- 1. Interview Sessions (Lifecycle & State)
CREATE TABLE interview_sessions (
    id BIGSERIAL PRIMARY KEY,
    candidate_id VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    track VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    session_mode VARCHAR(20) NOT NULL DEFAULT 'INTERVIEW',
    planned_slugs TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sessions_candidate ON interview_sessions(candidate_id);
CREATE INDEX idx_sessions_status ON interview_sessions(status);

-- 2. Session Messages (Relational Audit Log)
CREATE TABLE session_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    content TEXT,
    code_snippet TEXT,
    integrity_signals JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_session_ts ON session_messages(session_id, timestamp);

-- 3. Question Bank (Catalog & Problem Seeds)
CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    track VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    problem_statement TEXT NOT NULL,
    starter_code TEXT,
    solution_code TEXT,
    sample_tests JSONB,
    constraints TEXT[],
    status VARCHAR(20) DEFAULT 'PUBLISHED'
);

CREATE INDEX idx_questions_track_diff ON questions(track, difficulty);
```

---

## 2. Document & Blob Persistence: MongoDB 7

MongoDB stores high-velocity hierarchical conversational transcripts and continuous WebM video recordings via GridFS.

### A. Full Session Transcript Document (`interview_sessions_mongo`)

```json
{
  "_id": { "$oid": "66d6a2f81498a44b1c7a1029" },
  "sessionId": 22,
  "candidateId": "ankit-tomar",
  "track": "ALGORITHMS_DATA_STRUCTURES",
  "difficulty": "SENIOR",
  "sessionMode": "INTERVIEW",
  "plannedSlugs": ["reverse-a-string", "two-sum", "lru-cache"],
  "transcript": [
    {
      "turnNumber": 1,
      "senderRole": "INTERVIEWER",
      "messageType": "GREETING",
      "content": "Hello Ankit! Welcome to today's algorithmic assessment...",
      "timestamp": "2026-09-02T10:00:05Z"
    },
    {
      "turnNumber": 2,
      "senderRole": "CANDIDATE",
      "messageType": "EXPLANATION",
      "content": "I plan to solve this using two pointers converging from both ends.",
      "codeSnippet": "public class Solution { ... }",
      "integritySignals": {
        "keystrokeCount": 182,
        "avgKeystrokeIntervalMs": 115,
        "copyCount": 0,
        "pasteCount": 0,
        "tabSwitchCount": 0
      },
      "timestamp": "2026-09-02T10:01:20Z"
    }
  ],
  "createdAt": "2026-09-02T10:00:00Z",
  "completedAt": "2026-09-02T10:45:00Z"
}
```

### B. MongoDB GridFS Recording Buckets

Video chunks are saved into the `fs.files` and `fs.chunks` collections:

```json
// fs.files document
{
  "_id": { "$oid": "66d6a3101498a44b1c7a1030" },
  "filename": "rec_22_chunk_00003.webm",
  "length": 482910,
  "chunkSize": 261120,
  "uploadDate": "2026-09-02T10:00:15.120Z",
  "metadata": {
    "sessionId": 22,
    "type": "RECORDING_CHUNK",
    "seq": 3,
    "sizeBytes": 482910
  }
}
```

---

## ⚠️ DO NOT (Database Constraints)

> [!CAUTION]
> **STRICT DATABASE CONSTRAINTS FOR FUTURE DEVELOPERS AND LLMs:**

1. **Do NOT migrate transcripts into PostgreSQL.** Storing complex conversation arrays and nested telemetry in relational tables causes excessive JOIN overhead and JSONB write contention.
2. **Do NOT migrate session lifecycle tables into MongoDB.** Session states require ACID compliance, foreign key constraints, and relational consistency with proctoring and evaluation services.
3. **Do NOT store binary video files as PostgreSQL BLOBs.** GridFS is purpose-built for streamable chunk storage; storing videos in PostgreSQL causes severe tablespace bloat and degraded vacuum performance.
4. **Do NOT remove the 7-day automated purge cron.** Video recordings must be purged to respect GDPR and disk usage quotas.
5. **Do NOT bypass schema migrations.** PostgreSQL migrations must be applied through Flyway/Liquibase scripts in `src/main/resources/db/migration`.
