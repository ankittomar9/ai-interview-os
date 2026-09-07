---
slug: dsa-lc90-subsets-ii
title: Subsets II
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- backtracking
- mid
- lc-90
buildProfile: judge0
source: inspired-by:operator-corpus/Q_47_Subsets_II.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '1

    1 2

    1 2 3

    1 2 3 4

    1 2 3 4 5

    1 2 3 5

    1 2 4

    1 2 4 5

    1 2 5

    1 3

    1 3 4

    1 3 4 5

    1 3 5

    1 4

    1 4 5

    1 5

    2

    2 3

    2 3 4

    2 3 4 5

    2 3 5

    2 4

    2 4 5

    2 5

    3

    3 4

    3 4 5

    3 5

    4

    4 5

    5'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '1

    1 2

    1 2 3

    1 2 3 4

    1 2 4

    1 3

    1 3 4

    1 4

    2

    2 3

    2 3 4

    2 4

    3

    3 4

    4'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '-3

    -3 -2

    -3 -2 -1

    -3 -2 -1 1

    -3 -2 -1 1 2

    -3 -2 -1 1 2 4

    -3 -2 -1 1 4

    -3 -2 -1 2

    -3 -2 -1 2 4

    -3 -2 -1 4

    -3 -2 1

    -3 -2 1 2

    -3 -2 1 2 4

    -3 -2 1 4

    -3 -2 2

    -3 -2 2 4

    -3 -2 4

    -3 -1

    -3 -1 1

    -3 -1 1 2

    -3 -1 1 2 4

    -3 -1 1 4

    -3 -1 2

    -3 -1 2 4

    -3 -1 4

    -3 1

    -3 1 2

    -3 1 2 4

    -3 1 4

    -3 2

    -3 2 4

    -3 4

    -2

    -2 -1

    -2 -1 1

    -2 -1 1 2

    -2 -1 1 2 4

    -2 -1 1 4

    -2 -1 2

    -2 -1 2 4

    -2 -1 4

    -2 1

    -2 1 2

    -2 1 2 4

    -2 1 4

    -2 2

    -2 2 4

    -2 4

    -1

    -1 1

    -1 1 2

    -1 1 2 4

    -1 1 4

    -1 2

    -1 2 4

    -1 4

    1

    1 2

    1 2 4

    1 4

    2

    2 4

    4'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: '10

    10 10

    10 10 10'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: '1

    1 2

    1 2 3

    1 2 3 4

    1 2 3 4 5

    1 2 3 5

    1 2 4

    1 2 4 5

    1 2 5

    1 3

    1 3 4

    1 3 4 5

    1 3 5

    1 4

    1 4 5

    1 5

    2

    2 3

    2 3 4

    2 3 4 5

    2 3 5

    2 4

    2 4 5

    2 5

    3

    3 4

    3 4 5

    3 5

    4

    4 5

    5'
  weight: 50
hints:
- Analyze the problem using Backtracking algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Backtracking techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Subsets II


  This problem evaluates core techniques in Backtracking. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static List<List<Integer>> subsetsWithDup(int[] nums) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        List<List<Integer>> res = subsetsWithDup(arr);\n        if (res != null) {\n            for (List<Integer> row : res) {\n                for (int i = 0; i < row.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + row.get(i));\n                System.out.println();\n            }\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.List;\n\npublic class Main {\n    \n      public static List<List<Integer>> subsetsWithDup(int[] nums){\n        List<List<Integer>> result=new ArrayList<>();\n        Arrays.sort(nums);\n        backtrack(nums,0,new ArrayList<>(),result);\n        return result;\n    }\n    public static void backtrack(int[] nums,int start,\n        List<Integer> current,List<List<Integer>>result){\n        result.add(new ArrayList<>(current));\n\n        for(int i=start;i<nums.length;i++){\n            if(i>start && nums[i]==nums[i-1]) continue;\n            current.add(nums[i]);\n            backtrack(nums, i+1, current, result);\n            current.remove(current.size()-1);\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n       \
  \ for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        List<List<Integer>> res = subsetsWithDup(arr);\n        if (res != null) {\n            for (List<Integer> row : res) {\n                for (int i = 0; i < row.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + row.get(i));\n                System.out.println();\n            }\n        }\n    }\n}"
---

### Subsets II

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
