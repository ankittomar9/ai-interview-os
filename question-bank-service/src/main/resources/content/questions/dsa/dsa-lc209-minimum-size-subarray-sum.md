---
slug: dsa-lc209-minimum-size-subarray-sum
title: Minimum Size Subarray Sum
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [sliding-window, arrays]
est_minutes: 25
tags:
- sliding-window
- mid
- lc-209
buildProfile: judge0
source: inspired-by:operator-corpus/Q_30_Minimum_Size_Subarray_Sum.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '2 4

    2 7 11 15'
  expectedOutput: '1'
  description: Primary test case
- name: Sample 2
  input: '3 5

    1 2 3 4 5'
  expectedOutput: '1'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '2 3

    3 2 4'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '1 4

    1 2 3 4'
  expectedOutput: '1'
  weight: 25
- name: Hidden 3
  input: '4 5

    2 4 6 8 10'
  expectedOutput: '1'
  weight: 50
hints:
- Analyze the problem using Sliding Window algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Sliding Window techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Minimum Size Subarray Sum


  This problem evaluates core techniques in Sliding Window. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int minSubArrayLen(int target,int[] nums) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int target = sc.nextInt();\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(minSubArrayLen(target, arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n\n    public static int minSubArrayLen(int target,int[] nums){\n        if(nums==null || nums.length==0){ return 0;}\n        int left=0;\n        int sum=0; \n        int minLen=Integer.MAX_VALUE;\n\n        for(int right=0;right<nums.length;right++){\n            sum=sum+nums[right];\n\n            while(sum>=target && left<=right){\n                int newLength=right-left+1;\n                minLen=Math.min(minLen, newLength);\n                sum=sum-nums[left];\n                left++;\n            }\n        }\n        if(minLen>Integer.MAX_VALUE){\n            return 0;\n        }else{ return minLen;} \n      //  return minLen==Integer.MAX_VALUE ? 0: minLen;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int target = sc.nextInt();\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n\
  \        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(minSubArrayLen(target, arr));\n    }\n}"
---

### Minimum Size Subarray Sum

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
