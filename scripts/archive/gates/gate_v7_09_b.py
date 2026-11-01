#!/usr/bin/env python3
"""
Gate V7-09.b: Scripted verification for DSA Sub-Batch B (40 questions).
Verifies:
1. Each file exists and parses valid frontmatter.
2. Contains at least 2 reference approaches.
3. Exactly 1 PRIMARY approach and >= 1 ALTERNATE.
4. All approaches have kind: CODE with non-empty code.
5. No-Loss check: PRIMARY approach code is byte-identical to base commit 5ae0531 solutionCode.
"""

import sys
import subprocess
import yaml
from pathlib import Path

BASE_COMMIT = "5ae0531"
DSA_DIR = Path("question-bank-service/src/main/resources/content/questions/dsa")

BATCH_B_SLUGS = [
    "dsa-convert-decimal-to-binary",
    "dsa-convert-decimal-to-octal",
    "dsa-convert-integer-to-string",
    "dsa-convert-octal-to-decimal",
    "dsa-convert-string-to-integer-atoi",
    "dsa-count-common-subsequence-in-two-strings",
    "dsa-count-even-and-odd-numbers-in-an-array",
    "dsa-count-number-of-set-bits",
    "dsa-count-set-bits",
    "dsa-count-sum-of-numbers-in-a-string",
    "dsa-count-the-number-of-words-in-a-string",
    "dsa-count-vowels-in-a-string",
    "dsa-decimal-to-any-base",
    "dsa-decimal-to-any-base1",
    "dsa-decimal-to-binary-using-recursion",
    "dsa-determine-the-length-of-a-string-without-length",
    "dsa-diamond-star-pattern",
    "dsa-dijkstra-network-latency",
    "dsa-factorial-of-number",
    "dsa-factorial-using-recursion",
    "dsa-fibonacci-series-using-recursion",
    "dsa-fibonacci-using-recursion",
    "dsa-find-a-missing-number-in-an-array-of-1-to-n",
    "dsa-find-all-pairs-in-an-array-with-a-given-sum",
    "dsa-find-all-permutations-of-a-string",
    "dsa-find-majority-element-element-appearing-n-2-times",
    "dsa-find-max-element-in-array-using-recursion",
    "dsa-find-minimum-in-rotated-sorted-array",
    "dsa-find-non-repeating-characters-in-a-string",
    "dsa-find-the-ascii-value-of-a-character",
    "dsa-find-the-equilibrium-index-of-an-array",
    "dsa-find-the-factorial-of-a-number-iterative-recursive",
    "dsa-find-the-first-non-repeating-character",
    "dsa-find-the-frequency-of-each-element-in-an-array",
    "dsa-find-the-hcf-gcd-of-two-numbers",
    "dsa-find-the-kth-smallest-largest-element-quickselect-logic",
    "dsa-find-the-largest-element-in-an-array",
    "dsa-find-the-lcm-of-two-numbers",
    "dsa-find-the-longest-common-prefix-among-array-of-strings",
    "dsa-find-the-longest-palindromic-number-in-an-array"
]

def parse_frontmatter(content: str):
    if not content.startswith("---"):
        return None, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content
    return yaml.safe_load(parts[1]), parts[2]

def get_base_solution_code(slug: str) -> str:
    rel_path = f"question-bank-service/src/main/resources/content/questions/dsa/{slug}.md"
    out = subprocess.check_output(["git", "show", f"{BASE_COMMIT}:{rel_path}"], text=True, encoding="utf-8")
    fm, _ = parse_frontmatter(out)
    return (fm.get("solutionCode") or "").strip()

def verify_question(slug: str):
    file_path = DSA_DIR / f"{slug}.md"
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

    primaries = [a for a in approaches if a.get("approachClass") == "PRIMARY"]
    if len(primaries) != 1:
        print(f"[FAIL] {slug}: Expected exactly 1 PRIMARY approach, found {len(primaries)}")
        return False

    primary = primaries[0]
    base_code = get_base_solution_code(slug)
    primary_code = (primary.get("code") or "").strip()

    if not base_code:
        print(f"[FAIL] {slug}: Base commit 5ae0531 had empty solutionCode")
        return False

    if primary_code != base_code:
        print(f"[FAIL] {slug}: PRIMARY code differs from base commit 5ae0531! Len current={len(primary_code)}, base={len(base_code)}")
        return False

    for idx, a in enumerate(approaches):
        aid = a.get("approachId")
        if not aid:
            print(f"[FAIL] {slug} approach #{idx}: Missing approachId")
            return False
        kind = a.get("kind")
        if kind != "CODE":
            print(f"[FAIL] {slug} approach '{aid}': Expected kind CODE, got {kind}")
            return False
        code = a.get("code")
        if not code or not code.strip():
            print(f"[FAIL] {slug} approach '{aid}': Empty code payload")
            return False

    print(f"[PASS] {slug}: {len(approaches)} approaches | 1 PRIMARY | no-loss byte-identical to {BASE_COMMIT} ({len(base_code)} bytes)")
    return True

def main():
    print(f"=== Gate V7-09.b: Verifying {len(BATCH_B_SLUGS)} DSA Sub-Batch B questions against base {BASE_COMMIT} ===")
    all_passed = True
    for slug in BATCH_B_SLUGS:
        if not verify_question(slug):
            all_passed = False

    if not all_passed:
        print("\nFAILED: Gate V7-09.b checks failed.")
        sys.exit(1)
    else:
        print(f"\nSUCCESS: All {len(BATCH_B_SLUGS)} DSA Sub-Batch B questions passed Gate V7-09.b verification.")

if __name__ == "__main__":
    main()
