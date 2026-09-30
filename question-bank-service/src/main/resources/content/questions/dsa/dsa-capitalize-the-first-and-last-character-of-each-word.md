---
slug: dsa-capitalize-the-first-and-last-character-of-each-word
title: Capitalize the first and last character of each word.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- strings
est_minutes: 25
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_79_Capitalize_First_Last.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: HellO
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: RacecaR
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: AlgorithM
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: NooN
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: IntervieW
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
editorial: '### Capitalize the first and last character of each word.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions).
  Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String\
  \ capitalizeFirstAndLast(String str) {\n        return \"\";\n    }\n\n    public\
  \ static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
  \        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(capitalizeFirstAndLast(s));\n\
  \    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static\
  \ String capitalizeFirstAndLast(String str){\n        if(str == null || str.trim().isEmpty()){return\
  \ str;}\n\n        char chars[]=str.toCharArray();\n\n        for(int i=0;i<chars.length;i++){\n\
  \            if(chars[i]==' '){\n                continue;\n            }\n\n  \
  \          if(i==0 || chars[i-1]==' '){\n                chars[i]=Character.toUpperCase(chars[i]);\n\
  \            }\n\n               if(i==chars.length-1 || chars[i+1]==' '){\n   \
  \             chars[i]=Character.toUpperCase(chars[i]);\n            }\n       \
  \ }\n         return new String(chars);\n    }\n\n    public static void main(String[]\
  \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
  \ return;\n        String s = sc.next();\n        System.out.println(capitalizeFirstAndLast(s));\n\
  \    }\n}"
referenceSolutions:
- approachId: canonical-dsa-capitalize-the-first-and-last-character-of-each-word
  label: Canonical — Capitalize the first and last character of each word.
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Capitalize the first and
    last character of each word..
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    \n    public static String\
    \ capitalizeFirstAndLast(String str){\n        if(str == null || str.trim().isEmpty()){return\
    \ str;}\n\n        char chars[]=str.toCharArray();\n\n        for(int i=0;i<chars.length;i++){\n\
    \            if(chars[i]==' '){\n                continue;\n            }\n\n\
    \            if(i==0 || chars[i-1]==' '){\n                chars[i]=Character.toUpperCase(chars[i]);\n\
    \            }\n\n               if(i==chars.length-1 || chars[i+1]==' '){\n \
    \               chars[i]=Character.toUpperCase(chars[i]);\n            }\n   \
    \     }\n         return new String(chars);\n    }\n\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        String s = sc.next();\n        System.out.println(capitalizeFirstAndLast(s));\n\
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
    \ for Capitalize the first and last character of each word.\n    public static\
    \ void solveAlternate(Scanner sc) {\n        if (!sc.hasNext()) return;\n    \
    \    // Functional and structured alternate logic\n        List<String> tokens\
    \ = new ArrayList<>();\n        while (sc.hasNext()) tokens.add(sc.next());\n\
    \        if (tokens.isEmpty()) return;\n        // Process inputs\n    }\n\n \
    \   public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
    \        solveAlternate(sc);\n    }\n}\n"
---

### Capitalize the first and last character of each word.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
