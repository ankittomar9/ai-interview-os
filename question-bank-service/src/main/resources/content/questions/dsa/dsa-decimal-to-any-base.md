---
slug: dsa-decimal-to-any-base
title: Decimal To Any Base
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- bit-manipulation
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_02_Decimal_to_any_Base.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 12 18
  expectedOutput: "Converted number from decimal to anyBase  : \n12"
  description: Primary test case
- name: Sample 2
  input: 7 13
  expectedOutput: "Converted number from decimal to anyBase  : \n7"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 10 25
  expectedOutput: "Converted number from decimal to anyBase  : \n10"
  weight: 25
- name: Hidden 2
  input: 3 4
  expectedOutput: "Converted number from decimal to anyBase  : \n3"
  weight: 25
- name: Hidden 3
  input: 15 5
  expectedOutput: "Converted number from decimal to anyBase  : \n30"
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
editorial: '### Decimal To Any Base


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void decimalToAnyBaseHelper(int n,int b) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        decimalToAnyBaseHelper(a, b);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void decimalToAnyBaseHelper(int n,int b){\n          if (n == 0) {    System.out.println(\"Empty Number is given\");  return;}\n          \n      \n            \n         int  answer=0;int power=1;\n\n         while(n>0){\n            int remainder=n%b;\n            answer=answer+remainder*power;\n            n=n/b;\n            power=power*10;\n         }\n\n         System.out.println(\"Converted number from decimal to anyBase  : \\n\"+answer);\n\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        decimalToAnyBaseHelper(a, b);\n    }\n}"
---

### Decimal To Any Base

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
