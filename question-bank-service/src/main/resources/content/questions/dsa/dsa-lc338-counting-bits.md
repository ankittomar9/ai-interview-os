---
slug: dsa-lc338-counting-bits
title: Counting Bits
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [bit-manipulation]
est_minutes: 15
tags:
- bit-manipulation
- junior
- lc-338
buildProfile: judge0
source: inspired-by:operator-corpus/Q_23_Counting_Bits.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 0 1 1 2 1 2
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 0 1 1 2 1 2 2 3 1 2 2
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: 0 1
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 0 1 1 2 1 2 2 3
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 0 1 1 2 1 2 2 3 1 2 2 3 2
  weight: 50
hints:
- Analyze the problem using Bit Manipulation algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Bit Manipulation techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Counting Bits


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int[] solve(int n) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] res = solve(n);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static int[] solve(int n){\n       if (n < 0) {\n        System.out.println(\"Invalid input: \");  return new int[]{0};}\n\n        int ans[] =new int[n+1];\n        ans[0]=0;\n\n        for(int i=1;i<=n;i++){\n            ans[i]=ans[i>>1]+(i & 1);\n        }\n        return ans;\n    }    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] res = solve(n);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}"
---

### Counting Bits

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
