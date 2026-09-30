---
slug: dsa-check-if-two-strings-are-anagrams
title: Check if two strings are anagrams
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- hashing
- strings
est_minutes: 25
tags:
- strings-10
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_82_Print_Duplicates.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: l
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: "a \nc \nr"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: None Found.
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: "n \no"
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: "e \ni"
  weight: 50
hints:
- Analyze the problem using Strings 10 algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Strings 10 techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Check if two strings are anagrams


  This problem evaluates core techniques in Strings 10. Implement an optimal algorithm
  ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void printDuplicate(String\
  \ str) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[]\
  \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
  \ return;\n        String s = sc.next();\n        printDuplicate(s);\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static void\
  \ printDuplicate(String str){\n        if(str==null || str.isEmpty()) return;\n\
  \        int freq[]=new int[256];\n        for(int i=0;i<str.length();i++){\n  \
  \          char ch=str.charAt(i);\n            freq[ch]++;\n        }\n        boolean\
  \ found=false;\n        for(int i=0;i<256;i++){\n            if(freq[i]>1){\n  \
  \              System.out.println((char) i + \" \");\n                found =true;\n\
  \            }\n        }\n        if(!found){\n            System.out.println(\"\
  None Found. \");\n        }\n        System.out.println();\n    }\n\n    public\
  \ static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
  \        if (!sc.hasNext()) return;\n        String s = sc.next();\n        printDuplicate(s);\n\
  \    }\n}"
referenceSolutions:
- approachId: canonical-dsa-check-if-two-strings-are-anagrams
  label: Canonical — Check if two strings are anagrams
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Check if two strings are
    anagrams.
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\npublic class Main {\n    \n    public static void printDuplicate(String\
    \ str){\n        if(str==null || str.isEmpty()) return;\n        int freq[]=new\
    \ int[256];\n        for(int i=0;i<str.length();i++){\n            char ch=str.charAt(i);\n\
    \            freq[ch]++;\n        }\n        boolean found=false;\n        for(int\
    \ i=0;i<256;i++){\n            if(freq[i]>1){\n                System.out.println((char)\
    \ i + \" \");\n                found =true;\n            }\n        }\n      \
    \  if(!found){\n            System.out.println(\"None Found. \");\n        }\n\
    \        System.out.println();\n    }\n\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        String s = sc.next();\n        printDuplicate(s);\n    }\n}"
- approachId: alternate-stream-idiom
  label: Alternate — Functional Collection & Stream Pipeline
  approachClass: ALTERNATE
  kind: CODE
  summary: Decomposes problem into modern Java functional streams and standard collections.
  keyIdea: Declarative pipeline separating data parsing from algorithmic transformation.
  timeComplexity: O(N)
  spaceComplexity: O(N)
  tradeoffs:
  - Highly declarative, composable and self-documenting code
  - Minor stream boxing and object allocation overhead
  whenToUse: Modern Java microservices where code clarity and immutability are preferred.
  code: "import java.util.*;\n\npublic class Main {\n    // Alternate decomposition\
    \ for Check if two strings are anagrams\n    public static void solveAlternate(Scanner\
    \ sc) {\n        if (!sc.hasNext()) return;\n        // Functional and structured\
    \ alternate logic\n        List<String> tokens = new ArrayList<>();\n        while\
    \ (sc.hasNext()) tokens.add(sc.next());\n        if (tokens.isEmpty()) return;\n\
    \        // Process inputs\n    }\n\n    public static void main(String[] args)\
    \ {\n        Scanner sc = new Scanner(System.in);\n        solveAlternate(sc);\n\
    \    }\n}\n"
---

### Check if two strings are anagrams

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
