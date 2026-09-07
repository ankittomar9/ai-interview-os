---
slug: dsa-any-base-to-decimal
title: Any Base To Decimal
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [bit-manipulation]
est_minutes: 15
tags:
- bit-manipulation
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_1_Any_base_to_decimal.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 12 18
  expectedOutput: 'Decimal value : 20'
  description: Primary test case
- name: Sample 2
  input: 7 13
  expectedOutput: 'Decimal value : 7'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 10 25
  expectedOutput: 'Decimal value : 25'
  weight: 25
- name: Hidden 2
  input: 3 4
  expectedOutput: 'Decimal value : 3'
  weight: 25
- name: Hidden 3
  input: 15 5
  expectedOutput: Invalid Number
  weight: 50
hints:
- Analyze the problem using Bit Manipulation algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Bit Manipulation techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Any Base To Decimal


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void anyBaseToDecimalHelper(int n,int b) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        anyBaseToDecimalHelper(a, b);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void anyBaseToDecimalHelper(int n,int b){\n          if (n == 0) {    System.out.println(\"Empty Number is given\");  return;}\n        int answer=0; int power=1;\n        while(n>0){\n            int remainder=n%10;\n            if(remainder>=b){ \n                System.out.print(\"Invalid Number\");  return;\n            }\n            answer=answer+remainder*power;\n            n=n/10;\n            power=power*b;\n        }\n        System.out.println(\"Decimal value : \"+answer);\n    }   \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        anyBaseToDecimalHelper(a, b);\n    }\n}"
---

### Any Base To Decimal

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
