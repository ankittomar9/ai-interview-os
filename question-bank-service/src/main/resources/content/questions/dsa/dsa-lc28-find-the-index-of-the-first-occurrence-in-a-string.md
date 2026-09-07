---
slug: dsa-lc28-find-the-index-of-the-first-occurrence-in-a-string
title: Find the Index of the First Occurrence in a String
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- strings
- junior
- lc-28
buildProfile: judge0
source: inspired-by:operator-corpus/Q_23_Find_the_Index_of_the_First_Occurrence_in_a_String_1.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: anagram nagaram
  expectedOutput: '-1'
  description: Primary test case
- name: Sample 2
  input: rat car
  expectedOutput: '-1'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: listen silent
  expectedOutput: '-1'
  weight: 25
- name: Hidden 2
  input: hello world
  expectedOutput: '-1'
  weight: 25
- name: Hidden 3
  input: abc cba
  expectedOutput: '-1'
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
editorial: '### Find the Index of the First Occurrence in a String


  This problem evaluates core techniques in Strings. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int strStr(String haystack,String needle) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(strStr(s1, s2));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static int strStr(String haystack,String needle){\n        if(needle== null || needle.isEmpty()){\n            return 0;\n        }\n        if (haystack==null || haystack.length()<needle.length()) {\n            return -1;\n        }\n            int hLen=haystack.length();\n            int nLen=needle.length();\n\n            for(int i=0;i<=hLen-nLen;i++){\n                int j=0;\n\n                while(j<nLen){\n                    if(haystack.charAt(i+j)!= needle.charAt(j)){\n                        break;\n                    }\n                    j++;\n                }\n                if(j==nLen){\n                    return i;\n                }\n            }\n            return -1;\n    }\n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(strStr(s1,\
  \ s2));\n    }\n}"
---

### Find the Index of the First Occurrence in a String

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
