---
slug: dsa-lc188-best-time-to-buy-and-sell-stock-iv
title: Best Time to Buy and Sell Stock IV
track: ALGORITHMS_DATA_STRUCTURES
difficulty: SENIOR
tags:
- dynamic-programming
- senior
- lc-188
buildProfile: judge0
source: inspired-by:operator-corpus/Q_149_Best_Time_to_Buy_and_Sell_Stock_IV.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '2 4

    2 7 11 15'
  expectedOutput: '13'
  description: Primary test case
- name: Sample 2
  input: '3 5

    1 2 3 4 5'
  expectedOutput: '4'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '2 3

    3 2 4'
  expectedOutput: '2'
  weight: 25
- name: Hidden 2
  input: '1 4

    1 2 3 4'
  expectedOutput: '3'
  weight: 25
- name: Hidden 3
  input: '4 5

    2 4 6 8 10'
  expectedOutput: '8'
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
editorial: '### Best Time to Buy and Sell Stock IV


  This problem evaluates core techniques in Dynamic Programming. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int maxProfit(int k,int[] prices) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int target = sc.nextInt();\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(maxProfit(target, arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n   public static int maxProfit(int k,int[] prices){\n    int n=prices.length;\n    if(k>=n/2){\n        int profit=0;\n        for(int i=1;i<n;i++){\n            if(prices[i]>prices[i-1]){\n                profit=profit+prices[i]-prices[i-1];\n            }\n        }\n        return profit;\n    }\n    int[][] dp=new int[k+1][2];\n    for(int t=0;t<=k;t++){\n        dp[t][0]=0;\n        dp[t][1]=Integer.MIN_VALUE;\n    }\n\n    for(int i=0;i<prices.length;i++){\n        for(int t=k;t>=1;t--){\n            dp[t][0]=Math.max(dp[t][0], dp[t][1]+prices[i]);\n            dp[t][1]=Math.max(dp[t][1], dp[t-1][0]-prices[i]);\n        }\n    }\n    return dp[k][0];\n   }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int target = sc.nextInt();\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n      \
  \  for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(maxProfit(target, arr));\n    }\n}"
---

### Best Time to Buy and Sell Stock IV

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
