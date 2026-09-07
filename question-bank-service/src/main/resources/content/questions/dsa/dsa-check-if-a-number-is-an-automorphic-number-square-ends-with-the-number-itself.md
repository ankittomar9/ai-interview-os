---
slug: dsa-check-if-a-number-is-an-automorphic-number-square-ends-with-the-number-itself
title: Check if a number is an Automorphic Number (Square ends with the number itself).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [math]
est_minutes: 15
tags:
- 1-basic-numbers--math-the-warm-up--25-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_12_Automorphic_number.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 'true'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 'false'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: 'true'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 'false'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 'false'
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
editorial: '### Check if a number is an Automorphic Number (Square ends with the number itself).


  This problem evaluates core techniques in 1. Basic Numbers & Math (The "Warm Up" - 25 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean automorphic_number_checker(int n) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(automorphic_number_checker(n));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static boolean automorphic_number_checker(int n){\n        if(n<0 ){            System.out.println(0);return false;        }\n\n        long square =(long) n*n;\n\n        while(n>0){\n          int extract1= n%10; \n          long extract2 = square % 10;\n\n          if(extract1 !=extract2){\n            return false;\n          }\n          n=n/10;\n          square=square/10;\n        }\n        return true;\n    }    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(automorphic_number_checker(n));\n    }\n}\n\n/*TC : O(Logn) reducing the number\n    SC: O(1) not extra space used\n*/"
---

### Check if a number is an Automorphic Number (Square ends with the number itself).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
