---
slug: dsa-lc12-integer-to-roman
title: Integer to Roman
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- math
- mid
- lc-12
buildProfile: judge0
source: inspired-by:operator-corpus/Q_18_Integer_to_Roman.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: V
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: X
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: I
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: VII
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: XII
  weight: 50
hints:
- Analyze the problem using Math algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Math techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Integer to Roman


  This problem evaluates core techniques in Math. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String intToRoman(int num) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(intToRoman(n));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static String intToRoman(int num){\n        if(num<0){return \"-1\";}\n        if(num==0){return \"0\";}\n        int[] values = {1000,900,500,400,100,90,50,40,10,9,5,4,1};\n        String[] symbols={\"M\", \"CM\", \"D\", \"CD\", \"C\", \"XC\",\n         \"L\", \"XL\", \"X\", \"IX\", \"V\", \"IV\", \"I\"};\n\n        StringBuilder sb=new StringBuilder();\n\n        for(int i=0;i<values.length;i++){\n            while(num >= values[i]){\n                sb.append(symbols[i]);\n                num=num-values[i];\n            }\n        }\n        return sb.toString();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(intToRoman(n));\n    }\n}"
---

### Integer to Roman

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
