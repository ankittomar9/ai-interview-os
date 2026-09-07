---
slug: dsa-lc312-burst-balloons
title: Burst Balloons
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [dp]
est_minutes: 40
tags:
- dynamic-programming
- senior
- lc-312
buildProfile: judge0
source: inspired-by:operator-corpus/Q_112_Burst_Balloons.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '110'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '46'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '40'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: '1110'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: '110'
  weight: 50
hints:
- Analyze the problem using Dynamic Programming algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Dynamic Programming techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Burst Balloons


  This problem evaluates core techniques in Dynamic Programming. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int maxCoins(int[] nums) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(maxCoins(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \npublic static int maxCoins(int[] nums){\n    int n=nums.length;\n    int[] padded=new int[n+2];\n    padded[0]=1;\n    padded[n+1]=1;\n    for(int i=0;i<n;i++){\n        padded[i+1]=nums[i];\n    }\n\n    int[][] dp=new int[n+2][n+2];\n\n    for(int len=2;len<=n+1;len++){\n        for(int left=0;left+len<=n+1;left++){\n            int right=left+len;\n            for(int k=left+1;k<right;k++){\n                int coins=padded[left] *padded[k]* padded[right]\n                +dp[left][k]+dp[k][right];\n                \n                dp[left][right]=Math.max(dp[left][right],coins);\n            }\n        }\n    }\n    return dp[0][n+1];\n}\n\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n\
  \        System.out.println(maxCoins(arr));\n    }\n}"
---

### Burst Balloons

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
