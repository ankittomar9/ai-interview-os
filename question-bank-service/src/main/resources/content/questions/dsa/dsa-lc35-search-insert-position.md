---
slug: dsa-lc35-search-insert-position
title: Search Insert Position
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [binary-search]
est_minutes: 15
tags:
- binary-search
- junior
- lc-35
buildProfile: judge0
source: inspired-by:operator-corpus/Q_114_Search_Insert_Position.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: '0'
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
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: '1'
  weight: 50
hints:
- Analyze the problem using Binary Search algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Binary Search techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Search Insert Position


  This problem evaluates core techniques in Binary Search. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int searchInsert(int[] nums,int target) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(searchInsert(arr, target));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static int searchInsert(int[] nums,int target){\n        int left=0;\n        int right=nums.length-1;\n\n        while(left<=right){\n            int mid=left+ (right-left)/2;\n\n            if(nums[mid] ==target){\n                return mid;\n            }\n            else if(nums[mid]<target){\n                left=mid+1;\n            }else{\n                right=mid-1;\n            }\n        }\n        return left;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(searchInsert(arr, target));\n    }\n}"
---

### Search Insert Position

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
