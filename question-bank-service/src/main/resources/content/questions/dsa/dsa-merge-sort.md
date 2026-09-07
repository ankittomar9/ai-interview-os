---
slug: dsa-merge-sort
title: Merge Sort.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 6-sorting--searching-15-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_5_Merge_Sort.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5 1 3

    10 20 30 40 50'
  expectedOutput: 10 20 30 40 50
  description: Primary test case
- name: Sample 2
  input: '4 0 2

    1 2 3 4'
  expectedOutput: 1 2 3 4
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 0 1

    5 10 15'
  expectedOutput: 5 10 15
  weight: 25
- name: Hidden 2
  input: '5 2 4

    2 4 6 8 10'
  expectedOutput: 2 4 6 8 10
  weight: 25
- name: Hidden 3
  input: '4 1 2

    100 200 300 400'
  expectedOutput: 100 200 300 400
  weight: 50
hints:
- Analyze the problem using 6. Sorting & Searching (15 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 6. Sorting & Searching (15 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Merge Sort.


  This problem evaluates core techniques in 6. Sorting & Searching (15 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void mergeSortFunc(int arr[],int si,int ei) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        mergeSortFunc(arr, a, b);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Arrays;\npublic class Main {\n    \n    public static void mergeSortFunc\n    (int arr[],int si,int ei){\n        if(si>=ei){return ;}\n        int mid=si+(ei-si)/2;\n        mergeSortFunc(arr,si,mid); //recursive calls \n         mergeSortFunc(arr,mid+1,ei);\n\n            //Call the merge function\n          merge(arr,si,mid,ei);\n    }\n    public static void merge\n    (int arr[],int si,int mid,int ei){\n        int aux_arr[]=new int[ei-si+1];\n\n        int i=si;int j=mid+1; int k=0;\n       while(i<=mid && j<=ei){\n            if(arr[i]<arr[j]){\n                aux_arr[k]=arr[i];\n                i++;\n            }else{\n                aux_arr[k]=arr[j];\n                j++;\n            }\n            k++;\n        }\n        while(i<=mid){\n            aux_arr[k++]=arr[i++];\n        }\n        while(j<=ei){\n              aux_arr[k++]=arr[j++];\n        }\n\n        //Copy back to original array\n        for(k=0,i=si;k<aux_arr.length;k++,i++){\n\
  \            arr[i]=aux_arr[k];\n        }\n    }\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        mergeSortFunc(arr, a, b);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Merge Sort.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
