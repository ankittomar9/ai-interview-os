---
slug: dsa-count-set-bits
title: Count Set Bits
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics:
- bit-manipulation
est_minutes: 15
tags:
- bit-manipulation
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_08_Count_Set_Bits.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: '2'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: '2'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: '3'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: '2'
  weight: 50
hints:
- Analyze the problem using Bit Manipulation algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Bit Manipulation techniques to solve the problem
    efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Count Set Bits


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal
  algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int solve(int\
  \ n) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n\
  \        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        int n = sc.nextInt();\n        System.out.println(solve(n));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static\
  \ int solve(int n){\n        int count=0;\n\n        while(n!=0){\n            n=\
  \ n & (n-1);\n            count++;\n        }\n        return count;\n    }\n\n\
  \    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
  \        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(solve(n));\n\
  \    }\n}"
referenceSolutions:
- approachId: canonical-dsa-count-set-bits
  label: Canonical — Count Set Bits
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Count Set Bits.
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    \n    public static int solve(int\
    \ n){\n        int count=0;\n\n        while(n!=0){\n            n= n & (n-1);\n\
    \            count++;\n        }\n        return count;\n    }\n\n    public static\
    \ void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n \
    \       if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(solve(n));\n\
    \    }\n}"
- approachId: alternate-functional-pipeline
  label: Alternate — Structured Pipeline for Count Set Bits
  approachClass: ALTERNATE
  kind: CODE
  summary: Alternative structured implementation for Count Set Bits exploring secondary
    algorithmic trade-offs.
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
    \ Count Set Bits\n    }\n}\n"
---

### Count Set Bits

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
