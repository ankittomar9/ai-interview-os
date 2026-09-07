---
slug: dsa-reverse-a-number
title: Reverse a Number.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [math]
est_minutes: 15
tags:
- 1-basic-numbers--math-the-warm-up--25-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_6_Check_If_Number_is_Palindrome.java
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
  expectedOutput: 'true'
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
editorial: '### Reverse a Number.


  This problem evaluates core techniques in 1. Basic Numbers & Math (The "Warm Up" - 25 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean palindromeChecker(int n) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(palindromeChecker(n));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n        \n        public static boolean palindromeChecker(int n){\n           if(n<0){ return false;\n           }\n           if (n >= 0 && n < 10) {\n            return true;\n        }\n           int original_number=n;\n           long reverse=0;\n            while(n!=0){\n                int lastDigit=n%10;\n                reverse=reverse*10+lastDigit;\n                n=n/10;\n\n            }\n            if(reverse> Integer.MAX_VALUE || reverse<Integer.MIN_VALUE){\n                return false;\n            }\n                return (int)reverse==original_number;\n        }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(palindromeChecker(n));\n    }\n}"
---

### Reverse a Number.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
