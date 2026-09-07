---
slug: dsa-lc179-largest-number
title: Largest Number
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- greedy
- mid
- lc-179
buildProfile: judge0
source: inspired-by:operator-corpus/Q_77_Largest_Number.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '54321'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '4321'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: 421-3-2-1
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: '101010'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: '54321'
  weight: 50
hints:
- Analyze the problem using Greedy algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Greedy techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Largest Number


  This problem evaluates core techniques in Greedy. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String largestNumber(int[] nums) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(largestNumber(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\nimport java.util.Comparator;\n\npublic class Main {\n    \n    public static String largestNumber(int[] nums){\n        String[] strs = new String[nums.length];\n        for (int i=0; i<nums.length; i++) {\n            strs[i] = String.valueOf(nums[i]);\n        }\n        Arrays.sort(strs, new Comparator<String>() {\n            @Override\n            public int compare(String a, String b) {\n                String order1 = a+b;\n                String order2 = b+a;\n                return order2.compareTo(order1); \n            }\n        });\n      \n        if (strs[0].equals(\"0\")) return \"0\";\n        StringBuilder sb = new StringBuilder();\n        for (String s:strs) {\n            sb.append(s);\n        }\n        return sb.toString();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[]\
  \ arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(largestNumber(arr));\n    }\n}"
---

### Largest Number

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
