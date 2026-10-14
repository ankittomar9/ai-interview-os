---
slug: sql-overlapping-interval-detection
title: "Detecting Overlapping Meeting Room Reservations"
track: SQL
difficulty: MEDIUM
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'self-join', 'intervals', 'temporal']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE room_bookings (\n  booking_id INT PRIMARY KEY,\n  room_id INT NOT NULL,\n  start_time TIMESTAMP NOT NULL,\n  end_time TIMESTAMP NOT NULL\n);\nINSERT INTO room_bookings (booking_id, room_id, start_time, end_time) VALUES\n  (1, 101, '2024-02-01 09:00:00', '2024-02-01 10:30:00'),\n  (2, 101, '2024-02-01 10:00:00', '2024-02-01 11:00:00'),\n  (3, 101, '2024-02-01 11:30:00', '2024-02-01 12:30:00'),\n  (4, 102, '2024-02-01 09:00:00', '2024-02-01 10:00:00'),\n  (5, 102, '2024-02-01 10:00:00', '2024-02-01 11:00:00');\n"
expectedCsv: "booking_id,room_id,conflicting_booking_id\n1,101,2\n2,101,1\n"
solutionSql: "SELECT DISTINCT\n  b1.booking_id,\n  b1.room_id,\n  b2.booking_id AS conflicting_booking_id\nFROM room_bookings b1\nJOIN room_bookings b2\n  ON b1.room_id = b2.room_id\n AND b1.booking_id <> b2.booking_id\n AND b1.start_time < b2.end_time\n AND b1.end_time > b2.start_time\nORDER BY b1.booking_id ASC, b2.booking_id ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-overlapping-interval-detection
    label: "Canonical — Detecting Overlapping Meeting Room Reservations"
    approachClass: PRIMARY
    kind: SQL
    summary: "Standard relational SQL query satisfying interview specifications."
    keyIdea: "Efficient schema join and aggregation matching relational constraints."
    timeComplexity: "O(N log N)"
    spaceComplexity: "O(N)"
    tradeoffs:
      - "Utilizes standard PostgreSQL indexing and relational constructs"
      - "Deterministic output ordering guaranteed via ORDER BY"
    whenToUse: "Standard solution for technical SQL interview evaluation."
    sql: "SELECT DISTINCT\n  b1.booking_id,\n  b1.room_id,\n  b2.booking_id AS conflicting_booking_id\nFROM room_bookings b1\nJOIN room_bookings b2\n  ON b1.room_id = b2.room_id\n AND b1.booking_id <> b2.booking_id\n AND b1.start_time < b2.end_time\n AND b1.end_time > b2.start_time\nORDER BY b1.booking_id ASC, b2.booking_id ASC;\n"
---

### Detecting Overlapping Meeting Room Reservations

Identify any conflicting room reservations that overlap in time for the same room. Two bookings overlap if `start_time < other.end_time AND end_time > other.start_time`. Return `booking_id`, `room_id`, and `conflicting_booking_id`, ordered by `booking_id` ascending, then `conflicting_booking_id` ascending.
