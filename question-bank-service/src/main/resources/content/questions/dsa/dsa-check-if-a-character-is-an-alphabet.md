---
slug: dsa-check-if-a-character-is-an-alphabet
title: Check if a Character is an Alphabet.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [strings]
est_minutes: 15
tags:
- 3-strings-the-tricky-part--35-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_67_Check_Alphabet.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: a
  expectedOutput: 'true'
  description: Primary test case
- name: Sample 2
  input: Z
  expectedOutput: 'true'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '9'
  expectedOutput: 'false'
  weight: 25
- name: Hidden 2
  input: e
  expectedOutput: 'true'
  weight: 25
- name: Hidden 3
  input: m
  expectedOutput: 'true'
  weight: 50
hints:
- Analyze the problem using 3. Strings (The "Tricky" Part - 35 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 3. Strings (The "Tricky" Part - 35 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Check if a Character is an Alphabet.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean isAlphabet(char ch) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        char c = sc.next().charAt(0);\n        System.out.println(isAlphabet(c));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n\n    public static boolean isAlphabet(char ch) {\n        // ASCII integer values range 65 A and 97 a\n        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {\n            return true;\n        } else {\n            return false;\n        }\n        \n        // we can actually write this entire function in one single line!\n        // return ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z'));\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        char c = sc.next().charAt(0);\n        System.out.println(isAlphabet(c));\n    }\n}"
---

### Check if a Character is an Alphabet.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
