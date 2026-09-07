---
slug: dsa-calculate-the-frequency-of-characters-in-a-string
title: Calculate the Frequency of characters in a string.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_80_Highest_Occurring_Character.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: l
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: c
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: a
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: o
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: i
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
editorial: '### Calculate the Frequency of characters in a string.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static char findMaxChar(String str) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(findMaxChar(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static char findMaxChar(String str){\n        if(str==null || str.length()==0){\n            throw new IllegalArgumentException(\"String cannot be empty\");}\n       \n        int freq[]= new int[256];\n        int maxFreq=-1;\n        char maxChar=' ';\n    \n        for(int i=0;i<str.length();i++){\n            char ch=str.charAt(i);\n\n             freq[ch]++;\n             if(freq[ch]>maxFreq){\n                maxFreq =freq[ch];\n                maxChar=ch;\n             }\n        }\n        return maxChar;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(findMaxChar(s));\n    }\n}"
---

### Calculate the Frequency of characters in a string.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
