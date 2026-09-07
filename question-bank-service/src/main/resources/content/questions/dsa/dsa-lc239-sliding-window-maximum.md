---
slug: dsa-lc239-sliding-window-maximum
title: Sliding Window Maximum
track: ALGORITHMS_DATA_STRUCTURES
difficulty: SENIOR
tags:
- sliding-window--monotonic-queue
- senior
- lc-239
buildProfile: judge0
source: inspired-by:operator-corpus/Q_96_Sliding_Window_Maximum.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: 7 11 15
  description: Primary test case
- name: Sample 2
  input: '5 3

    1 2 3 4 5'
  expectedOutput: 3 4 5
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    3 2 4'
  expectedOutput: 3 4
  weight: 25
- name: Hidden 2
  input: '4 1

    1 2 3 4'
  expectedOutput: 1 2 3 4
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: 8 10
  weight: 50
hints:
- Analyze the problem using Sliding Window / Monotonic Queue algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Sliding Window / Monotonic Queue techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Sliding Window Maximum


  This problem evaluates core techniques in Sliding Window / Monotonic Queue. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int[] maxSlidingWindow(int[] nums,int k) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = maxSlidingWindow(arr, target);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayDeque;\nimport java.util.Arrays;\nimport java.util.Deque;\n\npublic class Main {\n    \n    public static int[] maxSlidingWindow(int[] nums,int k){\n        int n=nums.length; int[] result=new int[n-k+1];\n        Deque<Integer> deque=new ArrayDeque<>();\n\n        for(int i=0;i<n;i++){\n\n            while(!deque.isEmpty() && deque.peekFirst()  <= i-k){\n                deque.pollFirst();\n            }\n\n            while(!deque.isEmpty() && nums[deque.peekLast()]  <= nums[i]){\n                deque.pollLast();\n            }\n\n            deque.offerLast(i);\n\n            if(i >=k-1){\n                result[i-k+1]= nums[deque.peekFirst()];\n            }\n        }\n        return result;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n\
  \        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = maxSlidingWindow(arr, target);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}"
---

### Sliding Window Maximum

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
