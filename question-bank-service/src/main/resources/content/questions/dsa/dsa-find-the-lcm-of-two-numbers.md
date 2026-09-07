---
slug: dsa-find-the-lcm-of-two-numbers
title: Find the LCM of two numbers.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- 1-basic-numbers--math-the-warm-up--25-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_16_LCM_Of_two_numbers_brute.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 12 18
  expectedOutput: "LCM of 12 and 18 is : \n36"
  description: Primary test case
- name: Sample 2
  input: 7 13
  expectedOutput: "LCM of 7 and 13 is : \n91"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 10 25
  expectedOutput: "LCM of 10 and 25 is : \n50"
  weight: 25
- name: Hidden 2
  input: 3 4
  expectedOutput: "LCM of 3 and 4 is : \n12"
  weight: 25
- name: Hidden 3
  input: 15 5
  expectedOutput: "LCM of 15 and 5 is : \n15"
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
editorial: '### Find the LCM of two numbers.


  This problem evaluates core techniques in 1. Basic Numbers & Math (The "Warm Up" - 25 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void lcm_helper(int a ,int b) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        lcm_helper(a, b);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main{\n    \n    public static void lcm_helper(int a ,int b){\n        if (a == 0 || b == 0) {\n            System.out.println(\"LCM is 0\");\n            return;\n        }\n       int lcm=0;\n       int range=a*b;\n        for(int i=1;i<=range;i++){\n            if(i%a==0 && i%b==0){\n                lcm=i;\n                break;\n            }\n        }\n        System.out.println(\"LCM of \"+a+\" and \"+b+ \" is : \\n\" +lcm);\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        lcm_helper(a, b);\n    }\n}"
---

### Find the LCM of two numbers.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
