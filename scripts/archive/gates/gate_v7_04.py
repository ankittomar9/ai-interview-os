#!/usr/bin/env python3
"""
Gate V7-04: SQL Reference-Approaches Batch Scripted Gate (8 questions)
Asserts:
  1. YAML frontmatter parses without error
  2. referenceSolutions is a list with >= 2 approaches
  3. Exactly one approach is marked PRIMARY
  4. approachId values are unique and kebab-case
  5. Payload matches kind (kind: SQL has non-empty sql, non-empty time/space complexity)
  6. No-Loss check: for every file, legacy solutionSql extracted from git commit 5ae0531
     is byte-identical to the PRIMARY approach payload.
"""
import glob
import os
import re
import subprocess
import sys
import yaml

SQL_DIR = "question-bank-service/src/main/resources/content/questions/sql"
BASE_COMMIT = "5ae0531"

def extract_frontmatter(content):
    parts = content.split("---", 2)
    if len(parts) < 3:
        raise ValueError("File does not contain valid YAML frontmatter delimiters '---'")
    return yaml.safe_load(parts[1])

def get_legacy_solution_sql(rel_path):
    cmd = ["git", "show", f"{BASE_COMMIT}:{rel_path}"]
    output = subprocess.check_output(cmd, text=True, encoding="utf-8")
    parsed = extract_frontmatter(output)
    return parsed.get("solutionSql", "")

def verify_sql_files():
    files = sorted(glob.glob(os.path.join(SQL_DIR, "*.md")))
    if len(files) != 8:
        print(f"FAIL: Expected exactly 8 SQL files, found {len(files)}")
        sys.exit(1)

    kebab_pattern = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    all_passed = True

    print(f"=== Gate V7-04: Verifying {len(files)} SQL questions against base {BASE_COMMIT} ===")

    for fpath in files:
        slug = os.path.splitext(os.path.basename(fpath))[0]
        rel_path = fpath.replace("\\", "/")

        with open(fpath, "r", encoding="utf-8") as fp:
            content = fp.read()

        try:
            fm = extract_frontmatter(content)
        except Exception as e:
            print(f"[FAIL] {slug}: YAML parse error: {e}")
            all_passed = False
            continue

        ref_sols = fm.get("referenceSolutions")
        if not isinstance(ref_sols, list) or len(ref_sols) < 2:
            print(f"[FAIL] {slug}: referenceSolutions must be a list with >= 2 approaches (found: {len(ref_sols) if isinstance(ref_sols, list) else 'none'})")
            all_passed = False
            continue

        primary_count = 0
        primary_sql = None
        seen_ids = set()
        approaches_valid = True

        for app in ref_sols:
            app_id = app.get("approachId", "")
            if not kebab_pattern.match(app_id):
                print(f"[FAIL] {slug}: approachId '{app_id}' is not valid kebab-case")
                approaches_valid = False
            if app_id in seen_ids:
                print(f"[FAIL] {slug}: duplicate approachId '{app_id}'")
                approaches_valid = False
            seen_ids.add(app_id)

            app_class = app.get("approachClass")
            if app_class == "PRIMARY":
                primary_count += 1
                primary_sql = app.get("sql")
            elif app_class != "ALTERNATE":
                print(f"[FAIL] {slug}: invalid approachClass '{app_class}'")
                approaches_valid = False

            kind = app.get("kind")
            if kind != "SQL":
                print(f"[FAIL] {slug}: expected kind SQL for SQL approach '{app_id}', got '{kind}'")
                approaches_valid = False

            sql_payload = app.get("sql")
            if not sql_payload or not sql_payload.strip():
                print(f"[FAIL] {slug}: missing sql payload for approach '{app_id}'")
                approaches_valid = False

            if not app.get("timeComplexity") or not app.get("spaceComplexity"):
                print(f"[FAIL] {slug}: missing timeComplexity or spaceComplexity for approach '{app_id}'")
                approaches_valid = False

        if primary_count != 1:
            print(f"[FAIL] {slug}: expected exactly 1 PRIMARY approach, found {primary_count}")
            approaches_valid = False

        # No-Loss verification against 5ae0531
        try:
            legacy_sql = get_legacy_solution_sql(rel_path)
            if not legacy_sql:
                print(f"[FAIL] {slug}: base commit {BASE_COMMIT} has empty legacy solutionSql")
                approaches_valid = False
            elif primary_sql != legacy_sql:
                print(f"[FAIL] {slug}: no-loss violation: PRIMARY payload does not match git show {BASE_COMMIT} byte-for-byte! (lengths: primary={len(primary_sql) if primary_sql else 0}, legacy={len(legacy_sql)})")
                approaches_valid = False
        except Exception as e:
            print(f"[FAIL] {slug}: failed to fetch legacy solutionSql from {BASE_COMMIT}: {e}")
            approaches_valid = False

        if approaches_valid:
            print(f"[PASS] {slug}: {len(ref_sols)} approaches | 1 PRIMARY | no-loss byte-identical to {BASE_COMMIT} ({len(primary_sql)} bytes)")
        else:
            all_passed = False

    if all_passed:
        print("\nSUCCESS: All 8 SQL questions passed Gate V7-04 verification.")
        sys.exit(0)
    else:
        print("\nFAILURE: One or more SQL questions failed Gate V7-04 verification.")
        sys.exit(1)

if __name__ == "__main__":
    verify_sql_files()
