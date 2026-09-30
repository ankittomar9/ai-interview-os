#!/usr/bin/env python3
"""
Gate V7-09.a: Scripted verification for DSA Sub-Batch A (40 questions).
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

BATCH_A_SLUGS = [
    "dsa-alphabet-pyramid-pattern",
    "dsa-any-base-to-decimal",
    "dsa-arrays-2d-column-wise-sum",
    "dsa-arrays-2d-printingall-elements",
    "dsa-arrays-2d-rectangular-matrix-main-diagonal-sum",
    "dsa-arrays-2d-row-wise-sum",
    "dsa-arrays-2d-scalar-product",
    "dsa-arrays-are-equal-or-not-order-doesn-t-matter",
    "dsa-binary-search-iterative",
    "dsa-binary-search-recursive",
    "dsa-binary-tree-maximum-path-sum",
    "dsa-bitwise-and-range",
    "dsa-bubble-sort",
    "dsa-calculate-the-average-of-elements-in-an-array",
    "dsa-calculate-the-frequency-of-characters-in-a-string",
    "dsa-calculate-the-power-of-a-number-x-n",
    "dsa-calculate-the-sum-of-elements-in-an-array",
    "dsa-capitalize-the-first-and-last-character-of-each-word",
    "dsa-check-for-balanced-parentheses",
    "dsa-check-if-a-character-is-a-vowel-or-consonant",
    "dsa-check-if-a-character-is-an-alphabet",
    "dsa-check-if-a-number-is-a-harshad-niven-number-divisible-by-sum-of-digits",
    "dsa-check-if-a-number-is-a-perfect-number-sum-of-divisors-number",
    "dsa-check-if-a-number-is-a-strong-number-sum-of-factorial-of-digits-number",
    "dsa-check-if-a-number-is-an-abundant-number",
    "dsa-check-if-a-number-is-an-armstrong-number",
    "dsa-check-if-a-number-is-an-automorphic-number-square-ends-with-the-number-itself",
    "dsa-check-if-a-number-is-prime",
    "dsa-check-if-a-string-is-a-palindrome",
    "dsa-check-if-an-array-is-a-subset-of-another-array",
    "dsa-check-if-array-is-sorted-or-not",
    "dsa-check-if-two-arrays-are-disjoint",
    "dsa-check-if-two-strings-are-anagrams",
    "dsa-check-if-two-strings-are-rotation-of-each-other",
    "dsa-check-if-two-strings-match-where-one-string-contains-wildcard-characters",
    "dsa-check-palindrome-string-using-recursion",
    "dsa-coin-change-minimum",
    "dsa-compare-two-linked-lists",
    "dsa-convert-binary-to-decimal",
    "dsa-convert-binary-to-octal"
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
    print(f"=== Gate V7-09.a: Verifying {len(BATCH_A_SLUGS)} DSA Sub-Batch A questions against base {BASE_COMMIT} ===")
    all_passed = True
    for slug in BATCH_A_SLUGS:
        if not verify_question(slug):
            all_passed = False

    if not all_passed:
        print("\nFAILED: Gate V7-09.a checks failed.")
        sys.exit(1)
    else:
        print(f"\nSUCCESS: All {len(BATCH_A_SLUGS)} DSA Sub-Batch A questions passed Gate V7-09.a verification.")

if __name__ == "__main__":
    main()
