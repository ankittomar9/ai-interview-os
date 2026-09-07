---
slug: dsa-lc290-word-pattern
title: Word Pattern
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- hash-map
- junior
- lc-290
buildProfile: judge0
source: inspired-by:operator-corpus/Q_41_Word_Pattern.java
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
editorial: '### Word Pattern


  This problem evaluates core techniques in Hash Map. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean wordPattern(String pattern,String s) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(wordPattern(s1, s2));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.HashMap;\nimport java.util.Map;\n\npublic class Main {\n    \n    public static boolean wordPattern(String pattern,String s){\n        if(pattern ==null || s==null || pattern.length()==0 || s.length()==0){ return false;}\n        String[] words=s.split(\" \");\n        if(pattern.length() !=words.length){return false;}\n        Map<Character,String> charToWord=new HashMap<>();\n        Map<String,Character>wordToChar=new HashMap<>();\n\n\n        for(int i=0; i<pattern.length();i++){\n            char c=pattern.charAt(i);\n            String word=words[i];\n            \n            if(charToWord.containsKey(c)){\n                  if(!charToWord.get(c).equals(word)) { \n                    return false; \n                 }\n                  \n            }  else{charToWord.put(c, word); }       \n\n            if(wordToChar.containsKey(word)){\n                  if(wordToChar.get(word)!=c){ return false; }                \n      \
  \                }\n            else   \n            {  wordToChar.put(word, c); }\n        }\n          return true;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(wordPattern(s1, s2));\n    }\n}"
---

### Word Pattern

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
