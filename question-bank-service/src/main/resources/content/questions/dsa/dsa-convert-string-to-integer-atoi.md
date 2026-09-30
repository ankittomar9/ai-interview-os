---
slug: dsa-convert-string-to-integer-atoi
title: Convert String to Integer (atoi).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- strings
est_minutes: 25
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_95_Roman_To_Integer.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '42'
  expectedOutput: '0'
  description: Primary test case
- name: Sample 2
  input: '-42'
  expectedOutput: '0'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '4193'
  expectedOutput: '0'
  weight: 25
- name: Hidden 2
  input: '0'
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: '9128'
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
editorial: '### Convert String to Integer (atoi).


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions).
  Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int romanToInt(String\
  \ str) {\n        return 0;\n    }\n\n    public static void main(String[] args)\
  \ {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        String s = sc.next();\n        System.out.println(romanToInt(s));\n   \
  \ }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static int\
  \ romanToInt(String str){\n        if(str ==null || str.isEmpty() ){return 0;}\n\
  \        int total=0;\n        for(int i=0;i<str.length();i++){\n            int\
  \ currentValue=getValue(str.charAt(i));\n\n            if(i<str.length()-1 && currentValue\
  \ < getValue(str.charAt(i+1))){\n                total=total-currentValue;\n   \
  \         }else{\n                total=total+currentValue;\n            }\n   \
  \     }\n        return total;\n    }\n    public static int getValue(char ch){\n\
  \        switch(ch){\n            case 'I': return 1;            case 'V': return\
  \ 5;            case 'X': return 10;\n            case 'L': return 50;         \
  \   case 'C': return 100;         case 'D': return 500;\n            case 'M': return\
  \ 1000;\n            default :return 0;\n        }\n    }\n\n    public static void\
  \ main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if\
  \ (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(romanToInt(s));\n\
  \    }\n}"
referenceSolutions:
- approachId: canonical-dsa-convert-string-to-integer-atoi
  label: Canonical — Convert String to Integer (atoi).
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Convert String to Integer
    (atoi)..
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\npublic class Main {\n    \n    public static int romanToInt(String\
    \ str){\n        if(str ==null || str.isEmpty() ){return 0;}\n        int total=0;\n\
    \        for(int i=0;i<str.length();i++){\n            int currentValue=getValue(str.charAt(i));\n\
    \n            if(i<str.length()-1 && currentValue < getValue(str.charAt(i+1))){\n\
    \                total=total-currentValue;\n            }else{\n             \
    \   total=total+currentValue;\n            }\n        }\n        return total;\n\
    \    }\n    public static int getValue(char ch){\n        switch(ch){\n      \
    \      case 'I': return 1;            case 'V': return 5;            case 'X':\
    \ return 10;\n            case 'L': return 50;            case 'C': return 100;\
    \         case 'D': return 500;\n            case 'M': return 1000;\n        \
    \    default :return 0;\n        }\n    }\n\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        String s = sc.next();\n        System.out.println(romanToInt(s));\n\
    \    }\n}"
- approachId: alternate-functional-pipeline
  label: Alternate — Structured Pipeline for Convert String to Integer (atoi).
  approachClass: ALTERNATE
  kind: CODE
  summary: Alternative structured implementation for Convert String to Integer (atoi).
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
    \ Convert String to Integer (atoi).\n    }\n}\n"
---

### Convert String to Integer (atoi).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
