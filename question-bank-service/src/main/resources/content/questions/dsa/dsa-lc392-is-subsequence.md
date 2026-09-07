---
slug: dsa-lc392-is-subsequence
title: Is Subsequence
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [dp, two-pointers]
est_minutes: 15
tags:
- two-pointers
- junior
- lc-392
buildProfile: judge0
source: inspired-by:operator-corpus/Q_26_Is_Subsequence.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: anagram nagaram
  expectedOutput: 'false'
  description: Primary test case
- name: Sample 2
  input: rat car
  expectedOutput: 'false'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: listen silent
  expectedOutput: 'false'
  weight: 25
- name: Hidden 2
  input: hello world
  expectedOutput: 'false'
  weight: 25
- name: Hidden 3
  input: abc cba
  expectedOutput: 'false'
  weight: 50
hints:
- Analyze the problem using Two Pointers algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Two Pointers techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Is Subsequence


  This problem evaluates core techniques in Two Pointers. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean isSubSequence(String s,String t) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(isSubSequence(s1, s2));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static boolean isSubSequence(String s,String t){\n        if(s==null || s.isEmpty()){return true;}\n        if(t==null || t.length()<s.length()){return false;}\n\n        int i=0;\n\n        for(int j=0;j<t.length();j++){\n            if(t.charAt(j)==s.charAt(i)){\n                i++;\n            }\n            if(i==s.length()){\n                return true;\n            }\n        }\n        return i==s.length();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(isSubSequence(s1, s2));\n    }\n}"
---

### Is Subsequence

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
