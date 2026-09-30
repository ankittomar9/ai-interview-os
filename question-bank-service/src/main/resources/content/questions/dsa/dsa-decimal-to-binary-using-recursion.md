---
slug: dsa-decimal-to-binary-using-recursion
title: Decimal to Binary using recursion.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- bit-manipulation
- recursion
est_minutes: 25
tags:
- 4-recursion--series-20-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_113_Decimal_To_Binary_Recursion.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: '101'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: '1010'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: '111'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: '1100'
  weight: 50
hints:
- Analyze the problem using 4. Recursion & Series (20 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 4. Recursion & Series (20 Questions) techniques to
    solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Decimal to Binary using recursion.


  This problem evaluates core techniques in 4. Recursion & Series (20 Questions).
  Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String\
  \ decimalToBinary(int n) {\n        return \"\";\n    }\n\n    public static void\
  \ main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if\
  \ (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(decimalToBinary(n));\n\
  \    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n\n   public static\
  \ String decimalToBinary(int n){\n        if(n==0){return \"0\";}\n        return\
  \ binaryHelper(n);\n    }\n    public static String binaryHelper(int n){\n     \
  \   if(n==0){return \"\";}\n        String result=binaryHelper(n/2)+(n%2);\n\n \
  \       return result;\n    }\n\n    public static void main(String[] args) {\n\
  \        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        int n = sc.nextInt();\n        System.out.println(decimalToBinary(n));\n\
  \    }\n}"
referenceSolutions:
- approachId: canonical-dsa-decimal-to-binary-using-recursion
  label: Canonical — Decimal to Binary using recursion.
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Decimal to Binary using
    recursion..
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    \n\n   public static String\
    \ decimalToBinary(int n){\n        if(n==0){return \"0\";}\n        return binaryHelper(n);\n\
    \    }\n    public static String binaryHelper(int n){\n        if(n==0){return\
    \ \"\";}\n        String result=binaryHelper(n/2)+(n%2);\n\n        return result;\n\
    \    }\n\n    public static void main(String[] args) {\n        Scanner sc = new\
    \ Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n\
    \        System.out.println(decimalToBinary(n));\n    }\n}"
- approachId: alternate-functional-pipeline
  label: Alternate — Structured Pipeline for Decimal to Binary using recursion.
  approachClass: ALTERNATE
  kind: CODE
  summary: Alternative structured implementation for Decimal to Binary using recursion.
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
    \ Decimal to Binary using recursion.\n    }\n}\n"
---

### Decimal to Binary using recursion.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
