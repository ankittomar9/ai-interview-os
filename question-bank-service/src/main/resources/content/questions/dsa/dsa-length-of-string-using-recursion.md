---
slug: dsa-length-of-string-using-recursion
title: Length of string using recursion.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [strings, recursion]
est_minutes: 25
tags:
- 4-recursion--series-20-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_106_Reverse_String_Recursion.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: olleh
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: racecar
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: mhtirogla
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: noon
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: weivretni
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
editorial: '### Length of string using recursion.


  This problem evaluates core techniques in 4. Recursion & Series (20 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String reverseString(String str) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(reverseString(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n\n    public static String reverseString(String str){\n        if(str==null ||str.length()<=1){ return str;}\n\n        String result=reverseString(str.substring(1))+str.charAt(0);\n\n        return result;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(reverseString(s));\n    }\n}"
---

### Length of string using recursion.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
