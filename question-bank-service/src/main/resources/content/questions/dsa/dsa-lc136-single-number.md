---
slug: dsa-lc136-single-number
title: Single Number
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics:
- bit-manipulation
est_minutes: 15
tags:
- bit-manipulation
- junior
- lc-136
buildProfile: judge0
source: inspired-by:operator-corpus/Q_128_Single_Number.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '1'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '4'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '-5'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: '10'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: '1'
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
editorial: '### Single Number


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal
  algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int singleNumber(int[]\
  \ nums) {\n        return 0;\n    }\n\n    public static void main(String[] args)\
  \ {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int\
  \ i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(singleNumber(arr));\n\
  \    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main\
  \ {\n    \n    public static int singleNumber(int[] nums){\n        int result=0;\n\
  \        for(int i=0;i<nums.length;i++){\n            result=result^nums[i];\n \
  \       }\n        return result;\n    }\n\n    public static void main(String[]\
  \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
  \ return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n    \
  \    for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(singleNumber(arr));\n\
  \    }\n}"
referenceSolutions:
- approachId: canonical-dsa-lc136-single-number
  label: Canonical — Single Number
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Single Number.
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n\
    \    \n    public static int singleNumber(int[] nums){\n        int result=0;\n\
    \        for(int i=0;i<nums.length;i++){\n            result=result^nums[i];\n\
    \        }\n        return result;\n    }\n\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n  \
    \      for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(singleNumber(arr));\n\
    \    }\n}"
- approachId: hashset-deduplication
  label: Alternate — HashSet Add/Remove Toggling
  approachClass: ALTERNATE
  kind: CODE
  summary: Uses a HashSet to add numbers on first encounter and remove on second,
    leaving only the unique element.
  keyIdea: Collection membership toggling in O(N) time and O(N) space.
  timeComplexity: O(N)
  spaceComplexity: O(N)
  tradeoffs:
  - Intuitive and easy to grasp for any general collection types
  - Allocates O(N) memory compared to optimal O(1) bitwise XOR
  whenToUse: When elements are complex non-integer objects where bitwise XOR cannot
    be applied.
  code: "import java.util.*;\n\npublic class Main {\n    public static int singleNumberSet(int[]\
    \ nums) {\n        Set<Integer> set = new HashSet<>();\n        for (int num :\
    \ nums) {\n            if (!set.add(num)) set.remove(num);\n        }\n      \
    \  return set.iterator().next();\n    }\n\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n \
    \       for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        System.out.println(singleNumberSet(nums));\n\
    \    }\n}\n"
---

### Single Number

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
