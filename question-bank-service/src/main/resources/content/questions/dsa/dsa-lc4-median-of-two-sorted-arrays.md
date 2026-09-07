---
slug: dsa-lc4-median-of-two-sorted-arrays
title: Median of Two Sorted Arrays
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [binary-search, arrays]
est_minutes: 40
tags:
- binary-search
- senior
- lc-4
buildProfile: judge0
source: inspired-by:operator-corpus/Q_120_Median_of_Two_Sorted_Arrays.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3

    1 2 3

    3

    2 3 4'
  expectedOutput: '2.5'
  description: Primary test case
- name: Sample 2
  input: '4

    4 9 5 1

    3

    9 4 8'
  expectedOutput: '1.0'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '2

    1 3

    2

    2 4'
  expectedOutput: '2.5'
  weight: 25
- name: Hidden 2
  input: '3

    1 1 1

    2

    1 2'
  expectedOutput: '1.0'
  weight: 25
- name: Hidden 3
  input: '4

    10 20 30 40

    3

    15 25 35'
  expectedOutput: '25.0'
  weight: 50
hints:
- Analyze the problem using Binary Search algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Binary Search techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Median of Two Sorted Arrays


  This problem evaluates core techniques in Binary Search. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static double findMedianSortedArrays(int[] nums1,int[] nums2) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        int[] arr1 = new int[n1];\n        for (int i = 0; i < n1; i++) arr1[i] = sc.nextInt();\n        int n2 = sc.nextInt();\n        int[] arr2 = new int[n2];\n        for (int i = 0; i < n2; i++) arr2[i] = sc.nextInt();\n        System.out.println(findMedianSortedArrays(arr1, arr2));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static double findMedianSortedArrays(int[] nums1,int[] nums2){\n        if(nums1.length>nums2.length){\n            return findMedianSortedArrays(nums2, nums1);\n        }\n        int m=nums1.length;int n=nums2.length;\n        int left=0;int right=m;\n\n        while(left<=right){\n            int cut1=(left+right)/2;\n            int cut2=(m+n+1)/2 -cut1;\n\n            int left1;\n            if(cut1==0){left1=Integer.MIN_VALUE;}else{left1=nums1[cut1-1];}\n\n            int right1;\n              if(cut1==m){right1=Integer.MAX_VALUE;}else{right1=nums1[cut1];}\n\n            int left2;\n               if(cut2==0){left2=Integer.MIN_VALUE;}else{left2=nums2[cut2-1];}\n\n                  int right2;\n              if(cut2==n){right2=Integer.MAX_VALUE;}else{right2=nums2[cut2];}\n\n              if(left1 <=right2 && left2 <=right1){\n                if((m+n)%2==0){\n                    double result=(Math.max(left1,\
  \ left2)+ Math.min(right1,right2))/2.0;\n                    return  result;\n                }else{\n                    return Math.max(left1, left2);\n                }\n              }else if(left1>right2){\n                right=cut1-1;\n              }else{\n                left=cut1+1;\n              }\n        }\n        throw new IllegalArgumentException(\"Input Array not Sorted\");\n\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        int[] arr1 = new int[n1];\n        for (int i = 0; i < n1; i++) arr1[i] = sc.nextInt();\n        int n2 = sc.nextInt();\n        int[] arr2 = new int[n2];\n        for (int i = 0; i < n2; i++) arr2[i] = sc.nextInt();\n        System.out.println(findMedianSortedArrays(arr1, arr2));\n    }\n}\n\n"
---

### Median of Two Sorted Arrays

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
