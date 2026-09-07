---
slug: dsa-count-common-subsequence-in-two-strings
title: Count common subsequence in two strings.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_85_Reverse_Each_Word.java
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
editorial: '### Count common subsequence in two strings.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String reverseEachWord(String str) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(reverseEachWord(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static String reverseEachWord(String str){\n        if(str==null || str.length()==0){System.out.println(\"empty String\"); return str;}\n   \n        String words[]=str.split(\" \");\n        \n        StringBuilder result=new StringBuilder();\n\n        for(int i=0;i<words.length;i++){\n            StringBuilder wordBuilder=new StringBuilder(words[i]);\n            wordBuilder.reverse();\n\n            result.append(wordBuilder);\n\n            if(i<words.length-1){\n                result.append(\" \");\n            }\n        }\n        return result.toString();\n    }    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(reverseEachWord(s));\n    }\n}"
---

### Count common subsequence in two strings.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
