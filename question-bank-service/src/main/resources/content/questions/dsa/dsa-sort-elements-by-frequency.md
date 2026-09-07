---
slug: dsa-sort-elements-by-frequency
title: Sort elements by Frequency.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [hashing, arrays]
est_minutes: 25
tags:
- 2-arrays-the-core--40-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_36_Sort_elements_by_Frequency.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 1 2 3 4 5
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 1 2 3 4
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: -3 -2 -1 1 2 4
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 10 10 10
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 1 2 3 4 5
  weight: 50
hints:
- Analyze the problem using 2. Arrays (The "Core" - 40 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 2. Arrays (The "Core" - 40 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Sort elements by Frequency.


  This problem evaluates core techniques in 2. Arrays (The "Core" - 40 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void sortByFrequency(int arr[]) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        sortByFrequency(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\nimport java.util.HashMap;\nimport java.util.Map;\npublic class Main {\n    \n    public static void sortByFrequency(int arr[]){\n        if(arr==null || arr.length==0) {return;}\n    \n        Map<Integer,Integer> map=new HashMap<>();\n        for(int i=0;i<arr.length;i++){\n            map.put(arr[i], map.getOrDefault(arr[i],0)+1);\n        }\n            Integer[] objArr=new Integer[arr.length];\n        for(int i=0;i<arr.length;i++){\n            objArr[i]=arr[i];\n        }\n               Arrays.sort(objArr, (n1, n2) -> {\n            int freq1 = map.get(n1);\n            int freq2 = map.get(n2);\n    \n            if (freq1 != freq2) {\n                return freq2 - freq1; \n            }\n            else {\n                return n1 - n2; \n            }\n        });\n        for (int i = 0; i < arr.length; i++) {\n            arr[i] = objArr[i];\n        }\n    }\n    \n\n    public static void main(String[] args) {\n\
  \        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        sortByFrequency(arr);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Sort elements by Frequency.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
