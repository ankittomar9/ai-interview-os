---
slug: dsa-maximize-profit-by-buying-and-selling-stocks-one-transaction
title: Maximize profit by buying and selling stocks (One transaction).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 2-arrays-the-core--40-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_62_Best_Time_To_Buy_Sell_Stock.java
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
- Analyze the problem using 2. Arrays (The "Core" - 40 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 2. Arrays (The "Core" - 40 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Maximize profit by buying and selling stocks (One transaction).


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int maxProfit(int[] prices) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(maxProfit(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n\n    public static int maxProfit(int[] prices) {\n        // Edge case\n        if (prices == null || prices.length < 2) {  return 0;     }\n        int minPrice = Integer.MAX_VALUE;\n        \n        int maxProfit = 0;\n        for (int i=0; i<prices.length; i++) {\n            if (prices[i] < minPrice) {\n                minPrice = prices[i];\n            } \n            else {\n                int currentProfit = prices[i] - minPrice;\n                if (currentProfit > maxProfit) {\n                    maxProfit = currentProfit;\n                }\n            }\n        }\n        return maxProfit;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(maxProfit(arr));\n\
  \    }\n}"
---

### Maximize profit by buying and selling stocks (One transaction).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
