#!/usr/bin/env python3
"""
Gate V7-03: LLD Reference-Approaches Batch Scripted Gate (11 questions)
Asserts:
  1. YAML frontmatter parses without error
  2. referenceSolutions is a list with >= 2 approaches
  3. Exactly one approach is marked PRIMARY
  4. approachId values are unique and kebab-case
  5. Payload matches kind (kind: CODE has non-empty code or files, non-empty time/space complexity)
  6. No-Loss check: for every file, legacy solutionCode extracted from git commit 5ae0531
     is byte-identical to the PRIMARY approach payload.
"""
import glob
import os
import re
import subprocess
import sys
import yaml

LLD_DIR = "question-bank-service/src/main/resources/content/questions/lld"
BASE_COMMIT = "5ae0531"

def extract_frontmatter(content):
    parts = content.split("---", 2)
    if len(parts) < 3:
        raise ValueError("File does not contain valid YAML frontmatter delimiters '---'")
    return yaml.safe_load(parts[1])

def get_legacy_solution_code(rel_path):
    cmd = ["git", "show", f"{BASE_COMMIT}:{rel_path}"]
    output = subprocess.check_output(cmd, text=True, encoding="utf-8")
    parsed = extract_frontmatter(output)
    return parsed.get("solutionCode", "")

def verify_lld_files():
    files = sorted(glob.glob(os.path.join(LLD_DIR, "*.md")))
    if len(files) != 11:
        print(f"FAIL: Expected exactly 11 LLD files, found {len(files)}")
        sys.exit(1)

    kebab_pattern = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    all_passed = True

    print(f"=== Gate V7-03: Verifying {len(files)} LLD questions against base {BASE_COMMIT} ===")

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
        primary_code = None
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
                primary_code = app.get("code")
            elif app_class != "ALTERNATE":
                print(f"[FAIL] {slug}: invalid approachClass '{app_class}'")
                approaches_valid = False

            kind = app.get("kind")
            if kind != "CODE":
                print(f"[FAIL] {slug}: expected kind CODE for LLD approach '{app_id}', got '{kind}'")
                approaches_valid = False

            code = app.get("code")
            files_map = app.get("files")
            if not code and not files_map:
                print(f"[FAIL] {slug}: missing code or files payload for approach '{app_id}'")
                approaches_valid = False

            if not app.get("timeComplexity") or not app.get("spaceComplexity"):
                print(f"[FAIL] {slug}: missing timeComplexity or spaceComplexity for approach '{app_id}'")
                approaches_valid = False

        if primary_count != 1:
            print(f"[FAIL] {slug}: expected exactly 1 PRIMARY approach, found {primary_count}")
            approaches_valid = False

        # No-Loss verification against 5ae0531
        try:
            legacy_code = get_legacy_solution_code(rel_path)
            if not legacy_code:
                print(f"[FAIL] {slug}: base commit {BASE_COMMIT} has empty legacy solutionCode")
                approaches_valid = False
            elif primary_code != legacy_code:
                print(f"[FAIL] {slug}: no-loss violation: PRIMARY payload does not match git show {BASE_COMMIT} byte-for-byte! (lengths: primary={len(primary_code) if primary_code else 0}, legacy={len(legacy_code)})")
                approaches_valid = False
        except Exception as e:
            print(f"[FAIL] {slug}: failed to fetch legacy solutionCode from {BASE_COMMIT}: {e}")
            approaches_valid = False

        if approaches_valid:
            print(f"[PASS] {slug}: {len(ref_sols)} approaches | 1 PRIMARY | no-loss byte-identical to {BASE_COMMIT} ({len(primary_code)} bytes)")
        else:
            all_passed = False

    if all_passed:
        print("\nSUCCESS: All 11 LLD questions passed Gate V7-03 verification.")
        sys.exit(0)
    else:
        print("\nFAILURE: One or more LLD questions failed Gate V7-03 verification.")
        sys.exit(1)

if __name__ == "__main__":
    verify_lld_files()
