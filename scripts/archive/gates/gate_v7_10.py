#!/usr/bin/env python3
"""
Gate V7-10: Scripted verification for Behavioral reference approaches (2 questions)
Ensures:
1. Each file exists and parses valid frontmatter.
2. Contains at least 2 reference approaches.
3. Contains exactly 1 PRIMARY approach and >= 1 ALTERNATE.
4. All approaches have kind: WRITEUP with non-empty writeUp and summary.
5. All approaches contain valid diagramNotes.
"""

import sys
import yaml
from pathlib import Path

BEHAVIORAL_DIR = Path("question-bank-service/src/main/resources/content/questions/behavioral")
EXPECTED_SLUGS = [
    "beh-critical-production-outage-rollback",
    "beh-cross-functional-technical-disagreement",
]

def parse_frontmatter(content: str):
    if not content.startswith("---"):
        return None, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content
    return yaml.safe_load(parts[1]), parts[2]

def verify_question(slug: str):
    file_path = BEHAVIORAL_DIR / f"{slug}.md"
    if not file_path.exists():
        print(f"[FAIL] {slug}: File not found at {file_path}")
        return False

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    fm, _ = parse_frontmatter(content)
    if not fm:
        print(f"[FAIL] {slug}: Failed to parse frontmatter")
        return False

    approaches = fm.get("referenceSolutions")
    if not approaches or not isinstance(approaches, list):
        print(f"[FAIL] {slug}: Missing or invalid referenceSolutions list")
        return False

    if len(approaches) < 2:
        print(f"[FAIL] {slug}: Expected >= 2 approaches, found {len(approaches)}")
        return False

    primary_count = sum(1 for a in approaches if a.get("approachClass") == "PRIMARY")
    if primary_count != 1:
        print(f"[FAIL] {slug}: Expected exactly 1 PRIMARY approach, found {primary_count}")
        return False

    approach_ids = set()
    for idx, a in enumerate(approaches):
        aid = a.get("approachId")
        if not aid:
            print(f"[FAIL] {slug} approach #{idx}: Missing approachId")
            return False
        if aid in approach_ids:
            print(f"[FAIL] {slug}: Duplicate approachId '{aid}'")
            return False
        approach_ids.add(aid)

        kind = a.get("kind")
        if kind != "WRITEUP":
            print(f"[FAIL] {slug} approach '{aid}': Expected kind WRITEUP, got {kind}")
            return False

        writeup = a.get("writeUp")
        if not writeup or not writeup.strip():
            print(f"[FAIL] {slug} approach '{aid}': Empty writeUp payload")
            return False

        summary = a.get("summary")
        if not summary or not summary.strip():
            print(f"[FAIL] {slug} approach '{aid}': Empty summary")
            return False

        diagram_notes = a.get("diagramNotes")
        if not diagram_notes or not diagram_notes.strip():
            print(f"[FAIL] {slug} approach '{aid}': Missing whiteboard diagramNotes")
            return False

    print(f"[PASS] {slug}: {len(approaches)} WRITEUP approaches | 1 PRIMARY | valid whiteboard diagramNotes")
    return True

def main():
    print(f"=== Gate V7-10: Verifying {len(EXPECTED_SLUGS)} Behavioral questions ===")
    all_passed = True
    for slug in EXPECTED_SLUGS:
        if not verify_question(slug):
            all_passed = False

    if not all_passed:
        print("\nFAILED: Gate V7-10 checks failed.")
        sys.exit(1)
    else:
        print(f"\nSUCCESS: All {len(EXPECTED_SLUGS)} Behavioral questions passed Gate V7-10 verification.")

if __name__ == "__main__":
    main()
