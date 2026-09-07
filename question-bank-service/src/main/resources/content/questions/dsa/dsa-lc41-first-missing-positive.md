---
slug: dsa-lc41-first-missing-positive
title: First Missing Positive
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [arrays]
est_minutes: 40
tags:
- arrays
- senior
- lc-41
buildProfile: judge0
source: inspired-by:operator-corpus/Q_17_First_Missing_Positive.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '6'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '5'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '3'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: '1'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: '6'
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
editorial: '### First Missing Positive


  This problem evaluates core techniques in Arrays. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int firstMissingPositive(int[] nums) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(firstMissingPositive(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static int firstMissingPositive(int[] nums){\n        if(nums==null || nums.length==0){return 1;}\n        int n=nums.length;\n\n        for(int i=0;i<n;i++){\n            while(nums[i]>=1 && nums[i]<=n && nums[nums[i]-1] !=nums[i]){\n\n                int home=nums[i]-1;\n                int temp=nums[home];\n                nums[home]=nums[i];\n                nums[i]=temp;\n            }\n        }\n\n        for(int i=0;i<n;i++){\n            if(nums[i]!=i+1){\n                return i+1;\n            }\n        }\n        return n+1;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(firstMissingPositive(arr));\n    }\n}"
---

### First Missing Positive

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
