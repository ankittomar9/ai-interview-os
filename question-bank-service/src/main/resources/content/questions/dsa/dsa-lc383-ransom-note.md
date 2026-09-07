---
slug: dsa-lc383-ransom-note
title: Ransom Note
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- hash-map
- junior
- lc-383
buildProfile: judge0
source: inspired-by:operator-corpus/Q_39_Ransom_Note.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: anagram nagaram
  expectedOutput: 'true'
  description: Primary test case
- name: Sample 2
  input: rat car
  expectedOutput: 'false'
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
- Analyze the problem using Hash Map algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Hash Map techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Ransom Note


  This problem evaluates core techniques in Hash Map. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean canConstruct(String ransomNote,String magazine) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(canConstruct(s1, s2));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static boolean canConstruct(String ransomNote,String magazine){\n        if(ransomNote==null || magazine==null ){ return false;}\n        if(ransomNote.length() > magazine.length()){ return false;}\n         int[] count = new int[26];\n\n    for (int i = 0; i < magazine.length(); i++) {\n        char currentChar = magazine.charAt(i);\n        int index = currentChar - 'a';\n        count[index] = count[index] + 1;\n            }\n    for (int i=0; i<ransomNote.length(); i++) {\n        char currentChar=ransomNote.charAt(i);\n        int index=currentChar - 'a';\n        count[index]=count[index] - 1;\n\n        if (count[index]<0) {\n            return false; \n        }\n    }\n    return true;\n        \n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(canConstruct(s1,\
  \ s2));\n    }\n}"
---

### Ransom Note

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
