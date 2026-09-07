---
slug: dsa-lc119-pascal-s-triangle-ii
title: Pascal's Triangle II
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [arrays]
est_minutes: 15
tags:
- arrays
- junior
- lc-119
buildProfile: judge0
source: inspired-by:operator-corpus/Q_51_Pascals_Triangle_II.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 1 5 10 10 5 1
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 1 10 45 120 210 252 210 120 45 10 1
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: 1 1
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 1 7 21 35 35 21 7 1
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 1 12 66 220 495 792 924 792 495 220 66 12 1
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
editorial: '### Pascal''s Triangle II


  This problem evaluates core techniques in Arrays. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static List<Integer> getRow(int rowIndex) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        List<Integer> res = getRow(n);\n        if (res != null) {\n            for (int i = 0; i < res.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + res.get(i));\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class Main {\n    \n\n    public static List<Integer> getRow(int rowIndex){\n        int[] dp=new int[rowIndex+1];\n        dp[0]=1;\n    \n        for(int row=1;row<=rowIndex;row++){\n            for(int j=row;j>=1;j--){\n                dp[j]= dp[j]+dp[j-1];\n            }\n\n        }\n        List<Integer> result =new ArrayList<>();\n        for(int val=0;val<dp.length;val++){\n            result.add(dp[val]);\n        }\n        return result;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        List<Integer> res = getRow(n);\n        if (res != null) {\n            for (int i = 0; i < res.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + res.get(i));\n            System.out.println();\n        }\n    }\n}"
---

### Pascal's Triangle II

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
