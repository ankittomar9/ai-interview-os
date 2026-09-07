---
slug: dsa-find-the-longest-common-prefix-among-array-of-strings
title: Find the Longest Common Prefix among array of strings.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_93_Longest_Common_Prefix.java
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
editorial: '### Find the Longest Common Prefix among array of strings.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String longestCommonPrefix(String str[]) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        String[] arr = new String[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.next();\n        System.out.println(longestCommonPrefix(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static String longestCommonPrefix(String str[]){\n        if(str==null || str.length==0){return \"\";}\n\n        String reference=str[0];\n        \n        for(int i=0;i<reference.length();i++){\n            char ch=reference.charAt(i);\n            \n            for(int j=1;j<str.length;j++){\n                if(i== str[j].length() || str[j].charAt(i) !=ch){\n                return reference.substring(0,i);\n            }\n            }            \n        }   \n            return reference;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        String[] arr = new String[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.next();\n        System.out.println(longestCommonPrefix(arr));\n    }\n}"
---

### Find the Longest Common Prefix among array of strings.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
