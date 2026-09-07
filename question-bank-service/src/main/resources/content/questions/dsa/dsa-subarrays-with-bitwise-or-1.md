---
slug: dsa-subarrays-with-bitwise-or-1
title: Subarrays With Bitwise Or 1
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- bit-manipulation
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_10_subarrays_with_Bitwise_OR_1.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 'Total Subarrays: 15

    Bad Subarrays: 0

    Good Subarrays: 15

    1 2 3 4 5'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 'Total Subarrays: 10

    Bad Subarrays: 0

    Good Subarrays: 10

    4 2 1 3'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: 'Total Subarrays: 21

    Bad Subarrays: 0

    Good Subarrays: 21

    -2 1 -3 4 -1 2'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 'Total Subarrays: 6

    Bad Subarrays: 0

    Good Subarrays: 6

    10 10 10'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 'Total Subarrays: 15

    Bad Subarrays: 0

    Good Subarrays: 15

    5 4 3 2 1'
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
editorial: '### Subarrays With Bitwise Or 1


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void solve(int arr[]) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        solve(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static void solve(int arr[]){\n     if(arr==null || arr.length==0){System.out.println(\"Array is empty or null\");return;}\n        int n=arr.length;\n        long totalSubarrays=(long)n*(n+1)/2;\n        long badSubarrays=0; //subarray having only zero;\n        long count=0;\n\n        for(int i=0;i<arr.length;i++){\n            if(arr[i]==0){\n                count++;\n            }else{\n                badSubarrays=badSubarrays + (count*(count+1)/2);\n                 count = 0;\n            }\n        }\n        // check the count of subarrays\n            if(count > 0){\n                badSubarrays = badSubarrays +(count*(count+1)/2);\n            }\n        long goodSubarrays=totalSubarrays - badSubarrays;\n        System.out.println(\"Total Subarrays: \" + totalSubarrays);\n        System.out.println(\"Bad Subarrays: \" + badSubarrays);\n        System.out.println(\"Good Subarrays:\
  \ \" + goodSubarrays);\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        solve(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Subarrays With Bitwise Or 1

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
