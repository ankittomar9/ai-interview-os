---
slug: dsa-number-pattern-2-1-22-333
title: Number Pattern 2 (1, 22, 333...).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [patterns]
est_minutes: 25
tags:
- 5-patterns--printing-15-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_134_Number_Pattern_2.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: '1

    22

    333

    4444

    55555'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: '1

    22

    333

    4444

    55555

    666666

    7777777

    88888888

    999999999

    11111111110'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: '1

    22

    333

    4444

    55555

    666666

    7777777'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: '1

    22

    333

    4444

    55555

    666666

    7777777

    88888888

    999999999

    11111111110

    122222222221

    1333333333332'
  weight: 50
hints:
- Analyze the problem using 5. Patterns & Printing (15 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 5. Patterns & Printing (15 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Number Pattern 2 (1, 22, 333...).


  This problem evaluates core techniques in 5. Patterns & Printing (15 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void printNumberPattern(int N) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printNumberPattern(n);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n     \n    public static void printNumberPattern(int N){\n        long base=0;\n\n        for(int i=1;i<=N;i++){\n            base=(base*10)+1;\n              \n            System.out.println(base*i);\n          \n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printNumberPattern(n);\n    }\n}"
---

### Number Pattern 2 (1, 22, 333...).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
