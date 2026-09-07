---
slug: dsa-lc15-3sum
title: 3Sum
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- two-pointers
- mid
- lc-15
buildProfile: judge0
source: inspired-by:operator-corpus/Q_29_3Sum.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: ''
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: ''
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '-3 -1 4

    -3 1 2'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: ''
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: ''
  weight: 50
hints:
- Analyze the problem using Two Pointers algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Two Pointers techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### 3Sum


  This problem evaluates core techniques in Two Pointers. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static List<List<Integer>> threeSum(int[] nums) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        List<List<Integer>> res = threeSum(arr);\n        if (res != null) {\n            for (List<Integer> row : res) {\n                for (int i = 0; i < row.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + row.get(i));\n                System.out.println();\n            }\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.List;\n\npublic class Main {\n    \n    public static List<List<Integer>> threeSum(int[] nums){\n        List<List<Integer>> result=new ArrayList<>();\n        if(nums==null || nums.length<3){\n            return result;\n        }\n        Arrays.sort(nums);\n        for(int i=0;i<nums.length-2;i++){\n            if(i>0 && nums[i]==nums[i-1]){\n                continue;\n            }\n\n             int left=i+1;int right=nums.length-1;\n             \n             while(left<right){\n                int sum=nums[i]+nums[left]+nums[right];\n                if(sum==0){\n                    result.add(Arrays.asList(nums[i],nums[left],nums[right]));\n                \n                while(left<right && nums[left]==nums[left+1]){ left++;}\n                 while(left<right && nums[right]==nums[right-1]){ right--;}\n\n                 left++;\n                 right--;\n          \
  \      }else if(sum<0){\n                    left++;\n                }else{\n                    right--;\n                }\n             }\n        }\n       return result;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        List<List<Integer>> res = threeSum(arr);\n        if (res != null) {\n            for (List<Integer> row : res) {\n                for (int i = 0; i < row.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + row.get(i));\n                System.out.println();\n            }\n        }\n    }\n}\n"
---

### 3Sum

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
