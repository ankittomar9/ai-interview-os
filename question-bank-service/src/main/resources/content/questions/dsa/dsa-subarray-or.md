---
slug: dsa-subarray-or
title: Subarray Or
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [bit-manipulation, arrays]
est_minutes: 15
tags:
- bit-manipulation
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_16_Subarray_OR.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '71'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '39'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '654705378'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: '60'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: '71'
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
editorial: '### Subarray Or


  This problem evaluates core techniques in Bit Manipulation. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int solve(int arr[]) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(solve(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static int solve(int arr[]){\n        if(arr==null || arr.length==0){ System.out.println(\"Empty or null Array :\");return  0;}\n        long mod=1000000007; int n=arr.length; long ans=0;\n        long  totalSubarrays = (long)n * (n+1)/2;\n        for(int i=0;i<=30;i++){\n            long count=0;         \n               long badSubarrays =0;\n\n            for(int j=0;j<n;j++){\n                if((arr[j] & (1<<i))==0){\n                    count++;}\n                else{\n                    badSubarrays =badSubarrays + (count * (count+1))/2;\n                    count=0;   }       }\n            if (count > 0) {badSubarrays += (count * (count + 1)) / 2;         }\n            long goodSubarrays =totalSubarrays - badSubarrays;\n            long bitValue =(1L<< i) %mod;\n            long contribution=( goodSubarrays % mod * bitValue) %mod;\n            ans=(ans +contribution)%mod;\n\
  \        }\n        return (int) ans;   \n     } \n  \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(solve(arr));\n    }\n}"
---

### Subarray Or

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
