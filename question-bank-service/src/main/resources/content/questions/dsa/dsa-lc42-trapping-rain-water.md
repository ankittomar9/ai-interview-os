---
slug: dsa-lc42-trapping-rain-water
title: Trapping Rain Water
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [two-pointers]
est_minutes: 40
tags:
- two-pointers
- senior
- lc-42
buildProfile: judge0
source: inspired-by:operator-corpus/Q_16_Rain_Water_trapping.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '0'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '3'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '7'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: '0'
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
editorial: '### Trapping Rain Water


  This problem evaluates core techniques in Two Pointers. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int trap(int[] height) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(trap(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static int trap(int[] height){\n        int n=height.length;\n        if(height==null || height.length==0){return -1;}\n\n        int[] leftMax=new int[n];\n        int[] rightMax=new int[n];\n\n        leftMax[0]=height[0];\n        for(int i=1;i<n;i++){\n            leftMax[i]=Math.max(leftMax[i-1], height[i]);\n        }\n\n        rightMax[n-1]=height[n-1];\n        for(int i=n-2;i>=0;i--){\n            rightMax[i]=Math.max(rightMax[i+1], height[i]);\n        }\n\n        int waterTrapped=0;\n        for(int i=0;i<n;i++){\n            int water=Math.min(leftMax[i], rightMax[i]);\n            waterTrapped=waterTrapped +water-height[i];\n        }\n        return waterTrapped;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n       \
  \ for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(trap(arr));\n    }\n}"
---

### Trapping Rain Water

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
