---
slug: dsa-lc31-next-permutation
title: Next Permutation
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- arrays
- mid
- lc-31
buildProfile: judge0
source: inspired-by:operator-corpus/Q_10_Next_Permutation.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 1 2 3 5 4
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 4 2 3 1
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: -2 1 -3 4 2 -1
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 10 10 10
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 1 2 3 4 5
  weight: 50
hints:
- Analyze the problem using Arrays algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Arrays techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Next Permutation


  This problem evaluates core techniques in Arrays. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void nextPermutation(int[] nums) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        nextPermutation(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static void nextPermutation(int[] nums){\n        if(nums ==null && nums.length<=1){return;}\n        int n=nums.length; int pivot=-1;\n\n        for(int i=n-2;i>=0;i--){\n            if(nums[i] <nums[i+1]){\n                pivot=i; \n                break;\n            }\n        }\n        if(pivot==-1){\n            reverse(nums,0,n-1);\n            return ;\n        }\n\n        for(int j=n-1;j>pivot;j--){\n            if (nums[j] > nums[pivot]) {\n            swap(nums, pivot, j);\n            break;\n        }\n        }\n        reverse(nums,pivot+1,n-1);\n    }   \n    public static void swap(int[] nums ,int i,int j){\n        int temp=nums[i];nums[i]=nums[j];nums[j]=temp;\n    }\n    public static void reverse(int[] nums, int l,int r){\n        while(l<r){ swap(nums,l,r);\n            l++;r--;\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner\
  \ sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        nextPermutation(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Next Permutation

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
