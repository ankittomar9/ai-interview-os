---
slug: dsa-check-if-a-number-is-an-abundant-number
title: Check if a number is an Abundant Number.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- 1-basic-numbers--math-the-warm-up--25-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_14_Abudant_number.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 5 is not an  abundant number
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 10 is not an  abundant number
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: 1 is not an  abundant number
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 7 is not an  abundant number
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 12 is abundant number
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
editorial: '### Check if a number is an Abundant Number.


  This problem evaluates core techniques in 1. Basic Numbers & Math (The "Warm Up" - 25 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void abundant_Number_Helper(int n) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        abundant_Number_Helper(n);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void abundant_Number_Helper(int n){\n        if(n<=0){\n            System.out.println(\"Invalid Input\"); return;       }\n\n        int original_Number=n;\n        int sum=0;\n\n        for(int i=1;i<=n/2;i++){\n            if(n%i==0){\n                sum=sum+i;\n            }\n        }\n          //System.out.println(sum);\n        if(sum>original_Number){\n            System.out.println(n+\" is abundant number \");\n        }else{\n             System.out.println(n+\" is not an  abundant number \");\n        }\n    }\n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        abundant_Number_Helper(n);\n    }\n}"
---

### Check if a number is an Abundant Number.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
