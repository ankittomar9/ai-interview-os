---
slug: dsa-prime-number-check-using-recursion
title: Prime number check using recursion.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 4-recursion--series-20-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_115_Prime_Number_Check_Using_Recursion.java
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
  expectedOutput: 'false'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 'true'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 'false'
  weight: 50
hints:
- Analyze the problem using 4. Recursion & Series (20 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 4. Recursion & Series (20 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Prime number check using recursion.


  This problem evaluates core techniques in 4. Recursion & Series (20 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean isPrime(int n) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(isPrime(n));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static boolean isPrime(int n){\n        if(n<=1){return false;}\n        return isPrimeHelper(n,2);\n    }\n    public static boolean isPrimeHelper(int n,int i){\n        if(i*i>n){\n            return true;\n        }\n\n        if(n%i==0){\n            return false;\n        }\n\n        return isPrimeHelper(n,i+1);\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(isPrime(n));\n    }\n}"
---

### Prime number check using recursion.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
