---
slug: dsa-lc219-contains-duplicate-ii
title: Contains Duplicate II
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- arrays--hashing
- junior
- lc-219
buildProfile: judge0
source: inspired-by:operator-corpus/Q_46_Contains_Duplicate_II.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: 'false'
  description: Primary test case
- name: Sample 2
  input: '5 3

    1 2 3 4 5'
  expectedOutput: 'false'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    3 2 4'
  expectedOutput: 'false'
  weight: 25
- name: Hidden 2
  input: '4 1

    1 2 3 4'
  expectedOutput: 'false'
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: 'false'
  weight: 50
hints:
- Analyze the problem using Arrays & Hashing algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Arrays & Hashing techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Contains Duplicate II


  This problem evaluates core techniques in Arrays & Hashing. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean containsNearbyDuplicate(int[]  nums,int k) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(containsNearbyDuplicate(arr, target));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\nimport java.util.HashSet;\nimport java.util.Set;\n\npublic class Main {\n    \n    public static boolean containsNearbyDuplicate(int[]  nums,int k){\n        if(nums==null || nums.length<=1 || k ==0){\n            return false;\n        }\n        Set<Integer> set =new HashSet<>();\n        for(int i=0;i<nums.length;i++){\n            if(set.contains(nums[i])){\n                return true;\n            }\n            set.add(nums[i]);\n            if(set.size()>k){\n                set.remove(nums[i-k]);\n            }\n        }\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(containsNearbyDuplicate(arr, target));\n    }\n}"
---

### Contains Duplicate II

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
