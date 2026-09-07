---
slug: dsa-reverse-number-using-recursion-v2
title: Reverse Number Using Recursion V2
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [recursion]
est_minutes: 25
tags:
- recursion
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_6_Reverse_Number_Using_Recursion_v2.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 12 18
  expectedOutput: '1821'
  description: Primary test case
- name: Sample 2
  input: 7 13
  expectedOutput: '137'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 10 25
  expectedOutput: '2501'
  weight: 25
- name: Hidden 2
  input: 3 4
  expectedOutput: '43'
  weight: 25
- name: Hidden 3
  input: 15 5
  expectedOutput: '551'
  weight: 50
hints:
- Analyze the problem using Recursion algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Recursion techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Reverse Number Using Recursion V2


  This problem evaluates core techniques in Recursion. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static long reverseHelper(long n,long currentReverse) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        long a = sc.nextLong();\n        long b = sc.nextLong();\n        System.out.println(reverseHelper(a, b));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    /*/*Reverse a Number using Recursion Best Practice using Accumulator */\n    \n    public static long reverseHelper(long n,long currentReverse){\n                 if(n==0){  \n                 return currentReverse;    }\n\n            long extract=n%10;\n            long newReverse=(currentReverse*10)+extract;\n            \n            long reduce=n/10;\n\n            return reverseHelper(reduce,newReverse);\n    }    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        long a = sc.nextLong();\n        long b = sc.nextLong();\n        System.out.println(reverseHelper(a, b));\n    }\n}\n/*TC: O(log N) or O(digits)\n  SC:O(log N) (Stack)\n*/"
---

### Reverse Number Using Recursion V2

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
