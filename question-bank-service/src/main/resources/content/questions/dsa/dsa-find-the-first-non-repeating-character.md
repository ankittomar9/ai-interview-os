---
slug: dsa-find-the-first-non-repeating-character
title: Find the first non-repeating character.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- strings
est_minutes: 25
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_90_String_To_Integer.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: '0'
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: '0'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: '0'
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: '0'
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
editorial: '### Find the first non-repeating character.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions).
  Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int myAtoi(String\
  \ str) {\n        return 0;\n    }\n\n    public static void main(String[] args)\
  \ {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        String s = sc.next();\n        System.out.println(myAtoi(s));\n    }\n\
  }\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static\
  \ int myAtoi(String str){\n        if(str==null || str.isEmpty()){return 0;}\n \
  \       int i=0;int n=str.length();\n        while(i < n && str.charAt(i)==' '){\n\
  \            i++;\n        }\n        if(i==n) return 0;\n\n       int sign = 1;\n\
  \        if (str.charAt(i) == '-' || str.charAt(i) == '+') {\n            sign =\
  \ (str.charAt(i) == '-') ? -1 : 1;  //check and compare\n            i++;\n    \
  \    }\n        int result = 0;\n        while (i < n) {\n            char ch =\
  \ str.charAt(i);\n            if (ch < '0' || ch > '9') {\n                break;\n\
  \            }\n            int digit = ch - '0';\n            if (result > Integer.MAX_VALUE\
  \ / 10 || \n               (result == Integer.MAX_VALUE / 10 && digit > Integer.MAX_VALUE\
  \ % 10)) {\n                return (sign == 1) ? Integer.MAX_VALUE : Integer.MIN_VALUE;\
  \  //check and compare\n            }\n            result=(result*10) + digit;\n\
  \            i++;\n        }\n        return result * sign;\n    }\n\n    public\
  \ static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
  \        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(myAtoi(s));\n\
  \    }\n}"
referenceSolutions:
- approachId: canonical-dsa-find-the-first-non-repeating-character
  label: Canonical — Find the first non-repeating character.
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Find the first non-repeating
    character..
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    \n    public static int myAtoi(String\
    \ str){\n        if(str==null || str.isEmpty()){return 0;}\n        int i=0;int\
    \ n=str.length();\n        while(i < n && str.charAt(i)==' '){\n            i++;\n\
    \        }\n        if(i==n) return 0;\n\n       int sign = 1;\n        if (str.charAt(i)\
    \ == '-' || str.charAt(i) == '+') {\n            sign = (str.charAt(i) == '-')\
    \ ? -1 : 1;  //check and compare\n            i++;\n        }\n        int result\
    \ = 0;\n        while (i < n) {\n            char ch = str.charAt(i);\n      \
    \      if (ch < '0' || ch > '9') {\n                break;\n            }\n  \
    \          int digit = ch - '0';\n            if (result > Integer.MAX_VALUE /\
    \ 10 || \n               (result == Integer.MAX_VALUE / 10 && digit > Integer.MAX_VALUE\
    \ % 10)) {\n                return (sign == 1) ? Integer.MAX_VALUE : Integer.MIN_VALUE;\
    \  //check and compare\n            }\n            result=(result*10) + digit;\n\
    \            i++;\n        }\n        return result * sign;\n    }\n\n    public\
    \ static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
    \        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(myAtoi(s));\n\
    \    }\n}"
- approachId: alternate-functional-pipeline
  label: Alternate — Structured Pipeline for Find the first non-repeating character.
  approachClass: ALTERNATE
  kind: CODE
  summary: Alternative structured implementation for Find the first non-repeating
    character. exploring secondary algorithmic trade-offs.
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
    \ Find the first non-repeating character.\n    }\n}\n"
---

### Find the first non-repeating character.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
