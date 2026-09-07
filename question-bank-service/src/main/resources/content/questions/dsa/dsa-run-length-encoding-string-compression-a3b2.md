---
slug: dsa-run-length-encoding-string-compression-a3b2
title: Run Length Encoding (String Compression "a3b2").
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_94_Run_Length_Encoding.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: h1e1l2o1
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: r1a1c1e1c1a1r1
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: a1l1g1o1r1i1t1h1m1
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: n1o2n1
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: i1n1t1e1r1v1i1e1w1
  weight: 50
hints:
- Analyze the problem using 3. Strings (The "Tricky" Part - 35 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 3. Strings (The "Tricky" Part - 35 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Run Length Encoding (String Compression "a3b2").


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String compressString(String str) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(compressString(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n\n    public static String compressString(String str){\n        if(str==null || str.isEmpty()){return \"\";}\n    \n        StringBuilder sb=new StringBuilder();\n        int count=1;\n\n          for (int i=0; i<str.length(); i++) {\n            if(i==str.length()-1 || str.charAt(i)!= str.charAt(i+1)){\n                sb.append(str.charAt(i));\n                sb.append(count);\n                count=1;\n            }else{\n                count++;\n            }\n          }\n          return sb.toString();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(compressString(s));\n    }\n}"
---

### Run Length Encoding (String Compression "a3b2").

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
