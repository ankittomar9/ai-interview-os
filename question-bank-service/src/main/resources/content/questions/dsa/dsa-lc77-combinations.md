---
slug: dsa-lc77-combinations
title: Combinations
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- backtracking
- mid
- lc-77
buildProfile: judge0
source: inspired-by:operator-corpus/Q_102_Combinations.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: 4 2
  expectedOutput: '1 2

    1 3

    1 4

    2 3

    2 4

    3 4'
  description: Primary test case
- name: Sample 2
  input: 3 1
  expectedOutput: '1

    2

    3'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: 5 2
  expectedOutput: '1 2

    1 3

    1 4

    1 5

    2 3

    2 4

    2 5

    3 4

    3 5

    4 5'
  weight: 25
- name: Hidden 2
  input: 2 2
  expectedOutput: 1 2
  weight: 25
- name: Hidden 3
  input: 4 3
  expectedOutput: '1 2 3

    1 2 4

    1 3 4

    2 3 4'
  weight: 50
hints:
- Analyze the problem using Backtracking algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Backtracking techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Combinations


  This problem evaluates core techniques in Backtracking. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static List<List<Integer>> combine(int n,int k) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        List<List<Integer>> res = combine(a, b);\n        if (res != null) {\n            for (List<Integer> row : res) {\n                for (int i = 0; i < row.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + row.get(i));\n                System.out.println();\n            }\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class Main {\n        \n    public static List<List<Integer>> combine(int n,int k){\n        List<List<Integer>> result=new ArrayList<>();\n        backtrack(result, new ArrayList<>(), 1, n, k);\n        return result;\n    }\n    private static void backtrack(List<List<Integer>> result,List<Integer> current,\n        int start,int n,int k){\n\n            if(current.size()==k){\n                result.add(new ArrayList<>(current));\n                return;\n            }\n            for(int i=start;i<=n;i++){\n                current.add(i);\n                backtrack(result, current, i+1, n, k);\n                current.remove(current.size()-1);\n            }\n        }\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        List<List<Integer>>\
  \ res = combine(a, b);\n        if (res != null) {\n            for (List<Integer> row : res) {\n                for (int i = 0; i < row.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + row.get(i));\n                System.out.println();\n            }\n        }\n    }\n}"
---

### Combinations

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
