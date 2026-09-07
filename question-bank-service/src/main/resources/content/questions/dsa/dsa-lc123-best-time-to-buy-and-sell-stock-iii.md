---
slug: dsa-lc123-best-time-to-buy-and-sell-stock-iii
title: Best Time to Buy and Sell Stock III
track: ALGORITHMS_DATA_STRUCTURES
difficulty: SENIOR
tags:
- dynamic-programming
- senior
- lc-123
buildProfile: judge0
source: inspired-by:operator-corpus/Q_148_Best_Time_to_Buy_and_Sell_Stock_III.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '4'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '2'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '10'
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
editorial: '### Best Time to Buy and Sell Stock III


  This problem evaluates core techniques in Dynamic Programming. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int maxProfit(int[] prices) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(maxProfit(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static int maxProfit(int[] prices){\n        int buy1=Integer.MIN_VALUE;int buy2=Integer.MIN_VALUE;\n        int sell1=0;              int sell2=0;\n    \n        for(int i=0;i<prices.length;i++){\n\n            buy1=Math.max(buy1,-prices[i]);\n\n            sell1=Math.max(sell1, buy1+prices[i]);\n\n            buy2=Math.max(buy2, sell1-prices[i]);\n            \n            sell2=Math.max(sell2, buy2+prices[i]);\n        }\n        return sell2;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(maxProfit(arr));\n    }\n}"
---

### Best Time to Buy and Sell Stock III

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
