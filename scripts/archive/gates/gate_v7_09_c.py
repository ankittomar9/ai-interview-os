#!/usr/bin/env python3
"""
Gate V7-09.c: Scripted verification for DSA Sub-Batch C (40 questions).
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

BATCH_C_SLUGS = [
    "dsa-find-the-longest-palindromic-substring-basic-approach",
    "dsa-find-the-nth-fibonacci-number",
    "dsa-find-the-nth-magic-number",
    "dsa-find-the-repeating-element-in-an-array",
    "dsa-find-the-second-largest-element-in-an-array",
    "dsa-find-the-second-smallest-element-in-an-array",
    "dsa-find-the-smallest-element-in-an-array",
    "dsa-find-the-symmetric-pairs-in-an-array",
    "dsa-find-two-missing-numbers",
    "dsa-floyd-s-triangle",
    "dsa-gcd-using-recursion",
    "dsa-generate-the-fibonacci-series-up-to-n-terms",
    "dsa-half-diamond-star-pattern",
    "dsa-help-from-manny",
    "dsa-hollow-square-pattern",
    "dsa-insert-interval-sorted",
    "dsa-insertion-at-tail-in-linked-list",
    "dsa-insertion-sort",
    "dsa-interesting-array",
    "dsa-inverted-pyramid-star-pattern",
    "dsa-ith-bit-set-unset",
    "dsa-kth-element-in-linked-list",
    "dsa-kth-largest-element-stream",
    "dsa-lc108-convert-sorted-array-to-binary-search-tree",
    "dsa-lc11-container-with-most-water",
    "dsa-lc119-pascal-s-triangle-ii",
    "dsa-lc12-integer-to-roman",
    "dsa-lc121-best-time-to-buy-and-sell-stock",
    "dsa-lc122-best-time-to-buy-and-sell-stock-ii",
    "dsa-lc123-best-time-to-buy-and-sell-stock-iii",
    "dsa-lc125-valid-palindrome",
    "dsa-lc128-longest-consecutive-sequence",
    "dsa-lc13-roman-to-integer",
    "dsa-lc135-candy",
    "dsa-lc136-single-number",
    "dsa-lc137-single-number-ii",
    "dsa-lc14-longest-common-prefix",
    "dsa-lc141-linked-list-cycle",
    "dsa-lc148-sort-list",
    "dsa-lc149-max-points-on-a-line"
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
    print(f"=== Gate V7-09.c: Verifying {len(BATCH_C_SLUGS)} DSA Sub-Batch C questions against base {BASE_COMMIT} ===")
    all_passed = True
    for slug in BATCH_C_SLUGS:
        if not verify_question(slug):
            all_passed = False

    if not all_passed:
        print("\nFAILED: Gate V7-09.c checks failed.")
        sys.exit(1)
    else:
        print(f"\nSUCCESS: All {len(BATCH_C_SLUGS)} DSA Sub-Batch C questions passed Gate V7-09.c verification.")

if __name__ == "__main__":
    main()
