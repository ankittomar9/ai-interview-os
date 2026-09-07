---
slug: dsa-find-two-missing-numbers
title: Find Two Missing Numbers
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [bit-manipulation]
est_minutes: 15
tags:
- bit-manipulation
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_18_Find_Two_Missing_Numbers.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 6 7
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 6 5
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: -16 3
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 12 7
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 6 7
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
editorial: '### Find Two Missing Numbers


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int[] solve(int arr[]) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = solve(arr);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n    public static int[] solve(int arr[]){\nif (arr == null || arr.length < 2) {System.out.println(\"Invalid input: need at least 2 numbers\");\n        return new int[]{};    }\n        int n=arr.length+2; int xorSum=0;\n        for(int num: arr){            xorSum=xorSum^num;        }\n        for(int i=1;i<=n;i++){            xorSum=xorSum^i;        }\n\n        int rightMostSetBit=xorSum &-xorSum;\n        int bucketA=0; int bucketB=0;\n\n        for(int num : arr){\n            if((num & rightMostSetBit)==0){\n                                     bucketA =bucketA ^num;   }\n                            else{     bucketB =bucketB ^num;  }  }\n\n            for(int i=1;i<=n;i++){\n                    if((i & rightMostSetBit)==0){\n                                    bucketA =bucketA ^i;    }\n                        else{        bucketB =bucketB ^i;    }  }\n                        \n            if(bucketA<bucketB\
  \ ){\n               return new int[]{bucketA,bucketB};\n            }else{ return new int[]{bucketA,bucketB};    }       }      \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = solve(arr);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}"
---

### Find Two Missing Numbers

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
