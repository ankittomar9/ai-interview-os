---
slug: dsa-reverse-words-in-a-given-string
title: Reverse words in a given string.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [strings]
est_minutes: 25
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_87_String_Contains.java
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
editorial: '### Reverse words in a given string.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean contains(String haystack,String needle) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(contains(s1, s2));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static boolean contains(String haystack,String needle){\n        if(needle==null || needle.isEmpty()) return true;\n        if(haystack==null || haystack.length()<needle.length()) return false;\n        int n=haystack.length();\n        int m=needle.length();\n        for(int i=0;i<=n-m;i++){\n            int j;\n            for(j=0;j<m;j++){\n                if(haystack.charAt(i+j) != needle.charAt(j)){\n                    break;\n                }\n            }\n            if(j==m){  \n                return true;\n            }\n        }\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(contains(s1, s2));\n    }\n}"
---

### Reverse words in a given string.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
