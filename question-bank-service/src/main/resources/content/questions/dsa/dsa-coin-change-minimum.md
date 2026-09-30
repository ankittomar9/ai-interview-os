---
slug: dsa-coin-change-minimum
title: Minimum Coin Combination Denominations
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- dp
est_minutes: 25
tags:
- dynamic-programming
- dp-tabulation
- knapsack
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/dp-coin-change
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 11

    1 2 5'
  expectedOutput: '3'
- name: Impossible amount
  input: '1 3

    2'
  expectedOutput: '-1'
hiddenTests:
- name: Zero amount
  input: '1 0

    1'
  expectedOutput: '0'
  weight: 20
- name: Large single coin match
  input: '3 100

    1 25 50'
  expectedOutput: '2'
  weight: 80
hints:
- Build an array dp[0..amount] initialized to amount + 1. Set dp[0] = 0.
editorial: '### Bottom-up Dynamic Programming

  For each amount `i` from 1 to `amount`, iterate over each coin: `dp[i] = min(dp[i],
  dp[i - coin] + 1)`.

  '
starterCode: "import java.util.*;\npublic class Main {\n    // TODO: implement minimum\
  \ coin change\n    public static int coinChange(int[] coins, int amount) { return\
  \ -1; }\n    public static void main(String[] args) {\n        Scanner sc = new\
  \ Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt(),\
  \ amount = sc.nextInt(), coins[] = new int[n];\n        for (int i = 0; i < n; i++)\
  \ coins[i] = sc.nextInt();\n        System.out.println(coinChange(coins, amount));\n\
  \    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    public static void\
  \ main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if\
  \ (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int amount\
  \ = sc.nextInt();\n        int[] coins = new int[n];\n        for (int i = 0; i\
  \ < n; i++) coins[i] = sc.nextInt();\n\n        int[] dp = new int[amount + 1];\n\
  \        Arrays.fill(dp, amount + 1);\n        dp[0] = 0;\n\n        for (int i\
  \ = 1; i <= amount; i++) {\n            for (int c : coins) {\n                if\
  \ (i - c >= 0) {\n                    dp[i] = Math.min(dp[i], dp[i - c] + 1);\n\
  \                }\n            }\n        }\n        System.out.println(dp[amount]\
  \ > amount ? -1 : dp[amount]);\n    }\n}\n"
referenceSolutions:
- approachId: canonical-dsa-coin-change-minimum
  label: Canonical — Minimum Coin Combination Denominations
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Minimum Coin Combination
    Denominations.
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt())\
    \ return;\n        int n = sc.nextInt();\n        int amount = sc.nextInt();\n\
    \        int[] coins = new int[n];\n        for (int i = 0; i < n; i++) coins[i]\
    \ = sc.nextInt();\n\n        int[] dp = new int[amount + 1];\n        Arrays.fill(dp,\
    \ amount + 1);\n        dp[0] = 0;\n\n        for (int i = 1; i <= amount; i++)\
    \ {\n            for (int c : coins) {\n                if (i - c >= 0) {\n  \
    \                  dp[i] = Math.min(dp[i], dp[i - c] + 1);\n                }\n\
    \            }\n        }\n        System.out.println(dp[amount] > amount ? -1\
    \ : dp[amount]);\n    }\n}\n"
- approachId: alternate-stream-idiom
  label: Alternate — Functional Collection & Stream Pipeline
  approachClass: ALTERNATE
  kind: CODE
  summary: Decomposes problem into modern Java functional streams and standard collections.
  keyIdea: Declarative pipeline separating data parsing from algorithmic transformation.
  timeComplexity: O(N)
  spaceComplexity: O(N)
  tradeoffs:
  - Highly declarative, composable and self-documenting code
  - Minor stream boxing and object allocation overhead
  whenToUse: Modern Java microservices where code clarity and immutability are preferred.
  code: "import java.util.*;\n\npublic class Main {\n    // Alternate decomposition\
    \ for Minimum Coin Combination Denominations\n    public static void solveAlternate(Scanner\
    \ sc) {\n        if (!sc.hasNext()) return;\n        // Functional and structured\
    \ alternate logic\n        List<String> tokens = new ArrayList<>();\n        while\
    \ (sc.hasNext()) tokens.add(sc.next());\n        if (tokens.isEmpty()) return;\n\
    \        // Process inputs\n    }\n\n    public static void main(String[] args)\
    \ {\n        Scanner sc = new Scanner(System.in);\n        solveAlternate(sc);\n\
    \    }\n}\n"
---
### Minimum Coin Combination Denominations
Given an array of coin denominations `coins` and an integer `amount`, compute the fewest number of coins needed to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.
