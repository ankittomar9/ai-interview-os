---
slug: dsa-lc205-isomorphic-strings
title: Isomorphic Strings
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- strings--hash-map
- junior
- lc-205
buildProfile: judge0
source: inspired-by:operator-corpus/Q_40_Isomorphic_Strings.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: anagram nagaram
  expectedOutput: 'false'
  description: Primary test case
- name: Sample 2
  input: rat car
  expectedOutput: 'true'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: listen silent
  expectedOutput: 'true'
  weight: 25
- name: Hidden 2
  input: hello world
  expectedOutput: 'false'
  weight: 25
- name: Hidden 3
  input: abc cba
  expectedOutput: 'true'
  weight: 50
hints:
- Analyze the problem using Strings / Hash Map algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Strings / Hash Map techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Isomorphic Strings


  This problem evaluates core techniques in Strings / Hash Map. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean isIsomorphic(String s ,String t) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(isIsomorphic(s1, s2));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static boolean isIsomorphic(String s ,String t){\n        if(s==null || t==null ||s.length() !=t.length()){\n            return false;\n        }\n        int[] mapS=new int[256];\n        int[] mapT=new int[256];\n\n        for(int i=0;i<s.length();i++){\n            char c1=s.charAt(i);\n            char c2=t.charAt(i);\n\n            if(mapS[c1]!=mapT[c2]){\n                return false;\n            }\n            mapS[c1]=i+1;\n            mapT[c2]=i+1;\n        }\n        return true;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(isIsomorphic(s1, s2));\n    }\n}"
---

### Isomorphic Strings

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
