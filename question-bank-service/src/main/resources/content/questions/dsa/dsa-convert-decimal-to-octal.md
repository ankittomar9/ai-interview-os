---
slug: dsa-convert-decimal-to-octal
title: Convert Decimal to Octal.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- 1-basic-numbers--math-the-warm-up--25-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_22_Decimal_to_Octal.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 'Octal of  5 is : 5'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 'Octal of  10 is : 12'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: 'Octal of  1 is : 1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 'Octal of  7 is : 7'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 'Octal of  12 is : 14'
  weight: 50
hints:
- Analyze the problem using 1. Basic Numbers & Math (The "Warm Up" - 25 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 1. Basic Numbers & Math (The "Warm Up" - 25 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Convert Decimal to Octal.


  This problem evaluates core techniques in 1. Basic Numbers & Math (The "Warm Up" - 25 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void decimalToOctalHelper(int n) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        decimalToOctalHelper(n);\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static void decimalToOctalHelper(int n){\n        long octal=0; int original_Number=n;\n        long place=1;\n        while(n>0){\n             int remainder = n%8;\n\n            octal=octal+(remainder*place);\n            n=n/8;\n\n            place=place*10;\n        }\n               System.out.println(\"Octal of  \" + original_Number +  \" is : \"+octal);\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        decimalToOctalHelper(n);\n    }\n}"
---

### Convert Decimal to Octal.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
