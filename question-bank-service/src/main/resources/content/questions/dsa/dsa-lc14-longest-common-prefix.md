---
slug: dsa-lc14-longest-common-prefix
title: Longest Common Prefix
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- strings
- junior
- lc-14
buildProfile: judge0
source: inspired-by:operator-corpus/Q_20_Longest_Common_Prefix.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4

    flower flow flight flag'
  expectedOutput: fl
  description: Primary test case
- name: Sample 2
  input: '3

    dog racecar car'
  expectedOutput: ''
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '2

    hello world'
  expectedOutput: ''
  weight: 25
- name: Hidden 2
  input: '5

    a b c d e'
  expectedOutput: ''
  weight: 25
- name: Hidden 3
  input: '3

    abc ab a'
  expectedOutput: a
  weight: 50
hints:
- Analyze the problem using Strings algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Strings techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Longest Common Prefix


  This problem evaluates core techniques in Strings. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String longestCommonPrefix(String[] strs) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        String[] arr = new String[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.next();\n        System.out.println(longestCommonPrefix(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n\n    public static String longestCommonPrefix(String[] strs){\n        if(strs==null || strs.length==0){return \"\";}\n\n        String prefix=strs[0];\n\n        for(int i=1;i<strs.length;i++){\n            \n            while(strs[i].indexOf(prefix)!=0){\n                if(prefix.isEmpty()){\n                    return \"\";\n                 }\n                  prefix=prefix.substring(0,prefix.length()-1);\n            }\n           \n        }\n        return prefix;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        String[] arr = new String[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.next();\n        System.out.println(longestCommonPrefix(arr));\n    }\n}"
---

### Longest Common Prefix

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
