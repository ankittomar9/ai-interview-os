---
slug: dsa-lc918-maximum-sum-circular-subarray
title: Maximum Sum Circular Subarray
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [arrays]
est_minutes: 25
tags:
- arrays
- mid
- lc-918
buildProfile: judge0
source: inspired-by:operator-corpus/Q_113_Maximum_Sum_Circular_Subarray.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '15'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '10'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '5'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: '30'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: '15'
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
editorial: '### Maximum Sum Circular Subarray


  This problem evaluates core techniques in Arrays. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int maxSubarraySumCircular(int[] nums) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(maxSubarraySumCircular(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static int maxSubarraySumCircular(int[] nums){\n        int totalSum=0;\n        int maxSum=Integer.MIN_VALUE;\n        int currentMax=0; int minSum=Integer.MAX_VALUE;int currentMin=0;\n\n\n        for(int num:nums){\n            totalSum=totalSum+num;\n\n            currentMax=Math.max(currentMax+num,num);\n            maxSum=Math.max(maxSum, currentMax);\n\n            currentMin=Math.min(currentMin+num, num);\n            minSum=Math.min(minSum,currentMin);\n        }\n        if(maxSum<0){\n            return maxSum;\n        }\n        int result=Math.max(maxSum,totalSum- minSum);\n        return result;\n\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(maxSubarraySumCircular(arr));\n\
  \    }\n}"
---

### Maximum Sum Circular Subarray

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
