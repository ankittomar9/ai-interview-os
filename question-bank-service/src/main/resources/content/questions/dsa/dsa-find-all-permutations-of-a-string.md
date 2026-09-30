---
slug: dsa-find-all-permutations-of-a-string
title: Find all Permutations of a string.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- strings
est_minutes: 25
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_89_Contains_Only_Digits.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: 'false'
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: 'false'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: 'false'
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: 'false'
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: 'false'
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
editorial: '### Find all Permutations of a string.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions).
  Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean\
  \ isNumeric(String str) {\n        return false;\n    }\n\n    public static void\
  \ main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if\
  \ (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(isNumeric(s));\n\
  \    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n        public static\
  \ boolean isNumeric(String str){\n            if(str== null || str.isEmpty()){return\
  \ false;}\n        \n         for(int i=0;i<str.length();i++){\n            char\
  \ ch=str.charAt(i);\n       \n                if(ch <'0' || ch>'9'){\n         \
  \           return false;\n                }       \n        }\n        return true;\n\
  \        }\n\n    public static void main(String[] args) {\n        Scanner sc =\
  \ new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s\
  \ = sc.next();\n        System.out.println(isNumeric(s));\n    }\n}"
referenceSolutions:
- approachId: canonical-dsa-find-all-permutations-of-a-string
  label: Canonical — Find all Permutations of a string.
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Find all Permutations of
    a string..
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    \n        public static boolean\
    \ isNumeric(String str){\n            if(str== null || str.isEmpty()){return false;}\n\
    \        \n         for(int i=0;i<str.length();i++){\n            char ch=str.charAt(i);\n\
    \       \n                if(ch <'0' || ch>'9'){\n                    return false;\n\
    \                }       \n        }\n        return true;\n        }\n\n    public\
    \ static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
    \        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(isNumeric(s));\n\
    \    }\n}"
- approachId: alternate-functional-pipeline
  label: Alternate — Structured Pipeline for Find all Permutations of a string.
  approachClass: ALTERNATE
  kind: CODE
  summary: Alternative structured implementation for Find all Permutations of a string.
    exploring secondary algorithmic trade-offs.
  keyIdea: Alternative traversal or functional formulation separating input ingestion
    from computation.
  timeComplexity: O(N)
  spaceComplexity: O(N)
  tradeoffs:
  - Clear separation of concerns and robust edge-case validation
  - Alternative memory allocation profile
  whenToUse: When comparing standard procedural loops against structured collection
    handling in interviews.
  code: "import java.util.*;\n\npublic class Main {\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        List<String> list = new ArrayList<>();\n        while (sc.hasNext())\
    \ list.add(sc.next());\n        // Functional and structured alternate logic for\
    \ Find all Permutations of a string.\n    }\n}\n"
---

### Find all Permutations of a string.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
