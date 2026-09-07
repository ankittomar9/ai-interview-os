---
slug: dsa-check-if-a-character-is-a-vowel-or-consonant
title: Check if a Character is a Vowel or Consonant.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- 3-strings-the-tricky-part--35-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_66_Vowel_Or_Consonant.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: a
  expectedOutput: '''a'' is a Vowel.'
  description: Primary test case
- name: Sample 2
  input: Z
  expectedOutput: '''Z'' is a Consonant.'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '9'
  expectedOutput: '''9'' is not an alphabet letter.'
  weight: 25
- name: Hidden 2
  input: e
  expectedOutput: '''e'' is a Vowel.'
  weight: 25
- name: Hidden 3
  input: m
  expectedOutput: '''m'' is a Consonant.'
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
editorial: '### Check if a Character is a Vowel or Consonant.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void checkCharacter(char ch) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        char c = sc.next().charAt(0);\n        checkCharacter(c);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void checkCharacter(char ch) {\n        if (!Character.isLetter(ch)) {\n            System.out.println(\"'\" + ch + \"' is not an alphabet letter.\");\n            return;\n        }\n        char lowerCh = Character.toLowerCase(ch);\n           switch (lowerCh) {\n            case 'a':\n            case 'e':\n            case 'i':\n            case 'o':\n            case 'u':\n                System.out.println(\"'\" + ch + \"' is a Vowel.\");\n                break;\n            default:\n                System.out.println(\"'\" + ch + \"' is a Consonant.\");\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        char c = sc.next().charAt(0);\n        checkCharacter(c);\n    }\n}"
---

### Check if a Character is a Vowel or Consonant.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
