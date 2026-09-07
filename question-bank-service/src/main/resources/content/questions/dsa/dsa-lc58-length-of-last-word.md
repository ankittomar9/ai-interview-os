---
slug: dsa-lc58-length-of-last-word
title: Length of Last Word
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- strings
- junior
- lc-58
buildProfile: judge0
source: inspired-by:operator-corpus/Q_19_Length_of_Last_Word.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: '5'
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: '7'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: '9'
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: '4'
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: '9'
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
editorial: '### Length of Last Word


  This problem evaluates core techniques in Strings. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int lengthOfLastWord(String s) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(lengthOfLastWord(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static int lengthOfLastWord(String s){\n        if(s==null || s.isEmpty()){return 0;        }\n\n        int i=s.length()-1;\n        while(i>=0 && s.charAt(i)==' '){\n            i--;\n        }\n        if(i<0){\n            return 0;\n        }\n        int length=0;\n\n           while(i>=0 && s.charAt(i)!=' '){\n            length++;\n            i--;\n        }\n        return length;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(lengthOfLastWord(s));\n    }\n}"
---

### Length of Last Word

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
