---
slug: dsa-find-the-symmetric-pairs-in-an-array
title: Find the Symmetric Pairs in an array.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 2-arrays-the-core--40-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_49_Count_the_numbers_of_Subarrays_With_a_given_sum.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: '1'
  description: Primary test case
- name: Sample 2
  input: '5 3

    1 2 3 4 5'
  expectedOutput: '2'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    3 2 4'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '4 1

    1 2 3 4'
  expectedOutput: '1'
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: '1'
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
  approachHint: Utilize standard 2. Arrays (The "Core" - 40 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Find the Symmetric Pairs in an array.


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int countSubarrays(int arr[],int target) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(countSubarrays(arr, target));\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\nimport java.util.HashMap;\npublic class Main {\n    \n    public static int countSubarrays(int arr[],int target){\n        if(arr==null || arr.length==0){return 0;}\n\n        HashMap<Integer,Integer> sumHistory=new HashMap<>();\n        sumHistory.put(0, 1);\n\n        int currentSum=0;        int count =0;\n        for(int i=0;i<arr.length;i++){\n            currentSum=currentSum+arr[i];\n\n            int excess=currentSum-target;\n\n            if(sumHistory.containsKey(excess)){\n                count=count+sumHistory.get(excess);\n            }\n            int previousCount=sumHistory.getOrDefault(currentSum, 0);\n            sumHistory.put(currentSum,previousCount+1);\n        }\n        return count;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr\
  \ = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(countSubarrays(arr, target));\n    }\n}"
---

### Find the Symmetric Pairs in an array.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
