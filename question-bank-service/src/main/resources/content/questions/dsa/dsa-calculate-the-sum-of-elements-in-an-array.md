---
slug: dsa-calculate-the-sum-of-elements-in-an-array
title: Calculate the Sum of elements in an array.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics:
- arrays
est_minutes: 15
tags:
- 2-arrays-the-core--40-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_31_Check_If_Array_Is_Sorted.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 'true'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 'Violation Found at index : 0

    false'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: 'Violation Found at index : 1

    false'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 'true'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 'Violation Found at index : 0

    false'
  weight: 50
hints:
- Analyze the problem using 2. Arrays (The "Core" - 40 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 2. Arrays (The "Core" - 40 Questions) techniques
    to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Calculate the Sum of elements in an array.


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions).
  Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean\
  \ isArraySortedHelper(int arr[]) {\n        return false;\n    }\n\n    public static\
  \ void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n   \
  \     if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr\
  \ = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n  \
  \      System.out.println(isArraySortedHelper(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static boolean\
  \ isArraySortedHelper(int arr[]){\n        if(arr==null || arr.length==0){\n   \
  \         return true;\n        }\n        int n=arr.length;\n        boolean isSorted=true;\n\
  \        for(int i=0;i<n-1;i++){\n            if(arr[i]>arr[i+1]){\n           \
  \     isSorted=false;\n                System.out.println(\"Violation Found at index\
  \ : \"+i);\n                break;\n            }\n        }\n        return isSorted;\n\
  \    }\n\n    public static void main(String[] args) {\n        Scanner sc = new\
  \ Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n\
  \        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n\
  \        System.out.println(isArraySortedHelper(arr));\n    }\n}\n\n/*TC : is O(N)\n\
  \  SC :  is O(1)  */"
referenceSolutions:
- approachId: canonical-dsa-calculate-the-sum-of-elements-in-an-array
  label: Canonical — Calculate the Sum of elements in an array.
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Calculate the Sum of elements
    in an array..
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\npublic class Main {\n    \n    public static boolean\
    \ isArraySortedHelper(int arr[]){\n        if(arr==null || arr.length==0){\n \
    \           return true;\n        }\n        int n=arr.length;\n        boolean\
    \ isSorted=true;\n        for(int i=0;i<n-1;i++){\n            if(arr[i]>arr[i+1]){\n\
    \                isSorted=false;\n                System.out.println(\"Violation\
    \ Found at index : \"+i);\n                break;\n            }\n        }\n\
    \        return isSorted;\n    }\n\n    public static void main(String[] args)\
    \ {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n  \
    \      for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(isArraySortedHelper(arr));\n\
    \    }\n}\n\n/*TC : is O(N)\n  SC :  is O(1)  */"
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
    \ for Calculate the Sum of elements in an array.\n    public static void solveAlternate(Scanner\
    \ sc) {\n        if (!sc.hasNext()) return;\n        // Functional and structured\
    \ alternate logic\n        List<String> tokens = new ArrayList<>();\n        while\
    \ (sc.hasNext()) tokens.add(sc.next());\n        if (tokens.isEmpty()) return;\n\
    \        // Process inputs\n    }\n\n    public static void main(String[] args)\
    \ {\n        Scanner sc = new Scanner(System.in);\n        solveAlternate(sc);\n\
    \    }\n}\n"
---

### Calculate the Sum of elements in an array.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
