---
slug: dsa-lc215-kth-largest-element-in-an-array
title: Kth Largest Element in an Array
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [heap, arrays]
est_minutes: 25
tags:
- heap
- mid
- lc-215
buildProfile: judge0
source: inspired-by:operator-corpus/Q_121_Kth_Largest_Element_in_an_Array.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: '11'
  description: Primary test case
- name: Sample 2
  input: '5 3

    1 2 3 4 5'
  expectedOutput: '3'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    3 2 4'
  expectedOutput: '3'
  weight: 25
- name: Hidden 2
  input: '4 1

    1 2 3 4'
  expectedOutput: '4'
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: '4'
  weight: 50
hints:
- Analyze the problem using Heap algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Heap techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Kth Largest Element in an Array


  This problem evaluates core techniques in Heap. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int findKthLargest(int[] nums,int k) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(findKthLargest(arr, target));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static int findKthLargest(int[] nums,int k){\n        return quickSelect(nums,0,nums.length-1,nums.length-k);\n    }\n    public static int quickSelect(int[] nums,int left,int right,int k){\n        if(left==right){\n            return nums[left];\n        }\n\n        int pivotIndex=partition(nums,left,right);\n        if(k==pivotIndex){\n            return nums[k];\n        }else if(k<pivotIndex){\n            return quickSelect(nums, left, pivotIndex-1, k);\n        }else{\n            return quickSelect(nums, pivotIndex+1, right, k);\n        }\n    }\n    public static int partition(int[] nums,int left,int right){\n      int pivotIndex = left + (int)(Math.random() * (right - left + 1));\n    swap(nums, pivotIndex, right); // move pivot to end\n    int pivot = nums[right];\n    int i = left;\n    for (int j = left; j < right; j++) {\n        if (nums[j] < pivot) {\n            swap(nums,\
  \ i, j);\n            i++;\n        }\n    }\n    swap(nums, i, right);\n    return i;\n    }\n    public static void swap(int[] nums,int i,int j){\n        int temp=nums[i];\n        nums[i]=nums[j];\n        nums[j]=temp;\n    }\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(findKthLargest(arr, target));\n    }\n}"
---

### Kth Largest Element in an Array

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
