---
slug: dsa-check-if-a-number-is-a-perfect-number-sum-of-divisors-number
title: Check if a number is a Perfect Number (Sum of divisors = Number).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [math]
est_minutes: 15
tags:
- 1-basic-numbers--math-the-warm-up--25-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_11_Check_if_a_number_is_a_Perfect_Number.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 5 is NOT a Perfect Number
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 10 is NOT a Perfect Number
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: 1 is NOT a Perfect Number
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 7 is NOT a Perfect Number
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 12 is NOT a Perfect Number
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
editorial: '### Check if a number is a Perfect Number (Sum of divisors = Number).


  This problem evaluates core techniques in 1. Basic Numbers & Math (The "Warm Up" - 25 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void perfectNumberHelper(int n) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        perfectNumberHelper(n);\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n        public static void perfectNumberHelper(int n){\n            if(n<=1){\n              System.out.println(n + \" is NOT a Perfect Number\"); return ;            }\n              \n              int sum=0;      // why n/2 suppose the number is \n              // 28 we cannot include 28 so the last factor we can include is n/2 which 28/2 which 14\n              for(int i=1;i<=n/2;i++)   {\n                    if(n%i==0){\n                        sum=sum+i;\n                    }                   \n              }\n              if (sum == n) {\n                            System.out.println(n + \" is a Perfect Number\");\n              } else { \n                  System.out.println(n + \" is NOT a Perfect Number\");\n               }\n    }\n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        perfectNumberHelper(n);\n\
  \    }\n}"
---

### Check if a number is a Perfect Number (Sum of divisors = Number).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
