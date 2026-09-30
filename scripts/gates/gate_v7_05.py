#!/usr/bin/env python3
"""
Gate V7-05: HLD Reference-Approaches Batch Scripted Gate (27 questions)
Asserts:
  1. YAML frontmatter parses without error
  2. referenceSolutions is a list with >= 2 approaches
  3. Exactly one approach is marked PRIMARY
  4. approachId values are unique and kebab-case
  5. Each approach has kind: WRITEUP with non-empty writeUp payload
  6. Each approach provides summary, keyIdea, tradeoffs, whenToUse, and diagramNotes
"""
import glob
import os
import re
import sys
import yaml

HLD_DIR = "question-bank-service/src/main/resources/content/questions/hld"

def extract_frontmatter(content):
    parts = content.split("---", 2)
    if len(parts) < 3:
        raise ValueError("File does not contain valid YAML frontmatter delimiters '---'")
    return yaml.safe_load(parts[1])

def verify_hld_files():
    files = sorted(glob.glob(os.path.join(HLD_DIR, "*.md")))
    if len(files) != 27:
        print(f"FAIL: Expected exactly 27 HLD files, found {len(files)}")
        sys.exit(1)

    kebab_pattern = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    all_passed = True

    print(f"=== Gate V7-05: Verifying {len(files)} HLD questions ===")

    for fpath in files:
        slug = os.path.splitext(os.path.basename(fpath))[0]

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
            elif app_class != "ALTERNATE":
                print(f"[FAIL] {slug}: invalid approachClass '{app_class}'")
                approaches_valid = False

            kind = app.get("kind")
            if kind != "WRITEUP":
                print(f"[FAIL] {slug}: expected kind WRITEUP for HLD approach '{app_id}', got '{kind}'")
                approaches_valid = False

            write_up = app.get("writeUp")
            if not write_up or not str(write_up).strip():
                print(f"[FAIL] {slug}: missing writeUp payload for approach '{app_id}'")
                approaches_valid = False

            if not app.get("summary") or not app.get("keyIdea") or not app.get("tradeoffs") or not app.get("whenToUse"):
                print(f"[FAIL] {slug}: missing required architectural summary/keyIdea/tradeoffs/whenToUse for '{app_id}'")
                approaches_valid = False

            if not app.get("diagramNotes") or not str(app.get("diagramNotes")).strip():
                print(f"[FAIL] {slug}: missing diagramNotes for whiteboard in '{app_id}'")
                approaches_valid = False

        if primary_count != 1:
            print(f"[FAIL] {slug}: expected exactly 1 PRIMARY approach, found {primary_count}")
            approaches_valid = False

        if approaches_valid:
            print(f"[PASS] {slug}: {len(ref_sols)} WRITEUP approaches | 1 PRIMARY | valid whiteboard diagramNotes")
        else:
            all_passed = False

    if all_passed:
        print("\nSUCCESS: All 27 HLD questions passed Gate V7-05 verification.")
        sys.exit(0)
    else:
        print("\nFAILURE: One or more HLD questions failed Gate V7-05 verification.")
        sys.exit(1)

if __name__ == "__main__":
    verify_hld_files()
