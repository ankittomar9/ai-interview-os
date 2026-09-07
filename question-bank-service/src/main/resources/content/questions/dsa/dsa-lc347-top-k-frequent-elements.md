---
slug: dsa-lc347-top-k-frequent-elements
title: Top K Frequent Elements
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [heap]
est_minutes: 25
tags:
- heap
- mid
- lc-347
buildProfile: judge0
source: inspired-by:operator-corpus/Q_125_Top_K_Frequent_Elements.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: 15 7
  description: Primary test case
- name: Sample 2
  input: '5 3

    1 2 3 4 5'
  expectedOutput: 5 3 2
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    3 2 4'
  expectedOutput: 4 3
  weight: 25
- name: Hidden 2
  input: '4 1

    1 2 3 4'
  expectedOutput: '4'
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: 10 8 6 4
  weight: 50
hints:
- Analyze the problem using Heap algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Heap techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Top K Frequent Elements


  This problem evaluates core techniques in Heap. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int[] topKFrequentHeap(int[] nums,int k) {\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = topKFrequentHeap(arr, target);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\nimport java.util.HashMap;\nimport java.util.Map;\nimport java.util.PriorityQueue;\n\npublic class Main {\n    \n    public static int[] topKFrequentHeap(int[] nums,int k){\n        Map<Integer ,Integer> freq=new HashMap<>();\n        for(int num : nums)freq.merge(num, 1, Integer::sum);\n\n        PriorityQueue<Integer> heap=new PriorityQueue<>(\n            (a,b)-> freq.get(a) - freq.get(b)   );\n\n            for(int num : freq.keySet()){\n                heap.offer(num);\n                if(heap.size() >k){\n                    heap.poll();\n                }\n            }\n            int [] result=new int[k];\n            for(int i=0; i<k;i++){\n                result[i]=heap.poll();\n            }\n            return result;\n\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n\
  \        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        int[] res = topKFrequentHeap(arr, target);\n        if (res != null) {\n            for (int i = 0; i < res.length; i++) System.out.print((i > 0 ? \" \" : \"\") + res[i]);\n            System.out.println();\n        }\n    }\n}"
---

### Top K Frequent Elements

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
