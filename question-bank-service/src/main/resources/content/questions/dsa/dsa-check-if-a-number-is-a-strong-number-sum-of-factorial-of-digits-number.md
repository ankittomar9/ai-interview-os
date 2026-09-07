---
slug: dsa-check-if-a-number-is-a-strong-number-sum-of-factorial-of-digits-number
title: Check if a number is a Strong Number (Sum of factorial of digits = Number).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- 1-basic-numbers--math-the-warm-up--25-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_10_Check_if_a_number_is_a_Strong_Number.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 5 is NOT a Strong Number
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 10 is NOT a Strong Number
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: 1 is a Strong Number
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 7 is NOT a Strong Number
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 12 is NOT a Strong Number
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
editorial: '### Check if a number is a Strong Number (Sum of factorial of digits = Number).


  This problem evaluates core techniques in 1. Basic Numbers & Math (The "Warm Up" - 25 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void strongNumberChecker(int n) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        strongNumberChecker(n);\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    /*A number is called a Strong Number (or Krishnamurthy Number)\n     if the sum of the factorials of its digits equals the number itself.\n     Example (145):1! = 1 , 4! = 24 , 5! = 120 , Sum: 1 + 24 + 120 = 145. ) */\n    \n    public static void strongNumberChecker(int n){\n        if (n == 0) {\n        System.out.println(n + \" is NOT a Strong Number\");       return;    }\n       int originalNumber=n;\n       int sum=0;\n        while(n>0){\n         int extract =n%10;\n       \n        int fact=1;\n        for(int i=1;i<=extract;i++){\n            fact=fact*i;\n        }\n        sum=sum+fact;\n       \n            n=n/10;\n       }\n       if (sum == originalNumber) {\n            System.out.println(originalNumber + \" is a Strong Number\");\n        } else {\n            System.out.println(originalNumber + \" is NOT a Strong Number\");\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc\
  \ = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        strongNumberChecker(n);\n    }\n}\n\n/*TC : O(log(n))\n    SC: O(1)\n*/"
---

### Check if a number is a Strong Number (Sum of factorial of digits = Number).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
