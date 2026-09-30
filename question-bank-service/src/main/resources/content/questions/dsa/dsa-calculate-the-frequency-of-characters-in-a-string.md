---
slug: dsa-calculate-the-frequency-of-characters-in-a-string
title: Calculate the Frequency of characters in a string.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- hashing
- strings
est_minutes: 25
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
- Analyze the problem using 3. Strings (The "Tricky" Part - 35 Questions) algorithmic
  patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 3. Strings (The "Tricky" Part - 35 Questions) techniques
    to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Calculate the Frequency of characters in a string.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions).
  Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static char findMaxChar(String\
  \ str) {\n        return 0;\n    }\n\n    public static void main(String[] args)\
  \ {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        String s = sc.next();\n        System.out.println(findMaxChar(s));\n  \
  \  }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static\
  \ char findMaxChar(String str){\n        if(str==null || str.length()==0){\n   \
  \         throw new IllegalArgumentException(\"String cannot be empty\");}\n   \
  \    \n        int freq[]= new int[256];\n        int maxFreq=-1;\n        char\
  \ maxChar=' ';\n    \n        for(int i=0;i<str.length();i++){\n            char\
  \ ch=str.charAt(i);\n\n             freq[ch]++;\n             if(freq[ch]>maxFreq){\n\
  \                maxFreq =freq[ch];\n                maxChar=ch;\n             }\n\
  \        }\n        return maxChar;\n    }\n\n    public static void main(String[]\
  \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
  \ return;\n        String s = sc.next();\n        System.out.println(findMaxChar(s));\n\
  \    }\n}"
referenceSolutions:
- approachId: canonical-dsa-calculate-the-frequency-of-characters-in-a-string
  label: Canonical — Calculate the Frequency of characters in a string.
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Calculate the Frequency
    of characters in a string..
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    \n    public static char\
    \ findMaxChar(String str){\n        if(str==null || str.length()==0){\n      \
    \      throw new IllegalArgumentException(\"String cannot be empty\");}\n    \
    \   \n        int freq[]= new int[256];\n        int maxFreq=-1;\n        char\
    \ maxChar=' ';\n    \n        for(int i=0;i<str.length();i++){\n            char\
    \ ch=str.charAt(i);\n\n             freq[ch]++;\n             if(freq[ch]>maxFreq){\n\
    \                maxFreq =freq[ch];\n                maxChar=ch;\n           \
    \  }\n        }\n        return maxChar;\n    }\n\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        String s = sc.next();\n        System.out.println(findMaxChar(s));\n\
    \    }\n}"
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
    \ for Calculate the Frequency of characters in a string.\n    public static void\
    \ solveAlternate(Scanner sc) {\n        if (!sc.hasNext()) return;\n        //\
    \ Functional and structured alternate logic\n        List<String> tokens = new\
    \ ArrayList<>();\n        while (sc.hasNext()) tokens.add(sc.next());\n      \
    \  if (tokens.isEmpty()) return;\n        // Process inputs\n    }\n\n    public\
    \ static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
    \        solveAlternate(sc);\n    }\n}\n"
---

### Calculate the Frequency of characters in a string.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
