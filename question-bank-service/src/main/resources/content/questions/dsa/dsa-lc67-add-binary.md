---
slug: dsa-lc67-add-binary
title: Add Binary
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [bit-manipulation]
est_minutes: 15
tags:
- bit-manipulation
- junior
- lc-67
buildProfile: judge0
source: inspired-by:operator-corpus/Q_125_Add_Binary.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: anagram nagaram
  expectedOutput: '11011010101110'
  description: Primary test case
- name: Sample 2
  input: rat car
  expectedOutput: '1100011110'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: listen silent
  expectedOutput: '1111001000100'
  weight: 25
- name: Hidden 2
  input: hello world
  expectedOutput: '111011101011'
  weight: 25
- name: Hidden 3
  input: abc cba
  expectedOutput: '1010111100'
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
editorial: '### Add Binary


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String addBinary(String a ,String b) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(addBinary(s1, s2));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static String addBinary(String a ,String b){\n        StringBuilder sb=new StringBuilder();\n        int i=a.length()-1;int j=b.length()-1;\n        int carry=0;\n\n\n        while(i>=0 || j>=0 || carry>0){\n            int sum=carry;\n            if(i>=0){\n                sum=sum+a.charAt(i)-'0';\n                i--;\n            }\n\n            if(j>=0){\n                sum=sum+b.charAt(j)-'0';\n                j--;\n            }\n            int newSum=sum%2;\n            sb.append(newSum);\n            carry=sum/2;\n        }\n        return sb.reverse().toString();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(addBinary(s1, s2));\n    }\n}"
---

### Add Binary

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
