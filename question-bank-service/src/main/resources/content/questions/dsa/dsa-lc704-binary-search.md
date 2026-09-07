---
slug: dsa-lc704-binary-search
title: Binary Search
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [binary-search]
est_minutes: 15
tags:
- binary-search
- junior
- lc-704
buildProfile: judge0
source: inspired-by:operator-corpus/Q_1_Binary_Search.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: 'Target  Exists at Index : 0

    2 7 11 15'
  description: Primary test case
- name: Sample 2
  input: '5 3

    1 2 3 4 5'
  expectedOutput: 'Target  Exists at Index : 2

    1 2 3 4 5'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    3 2 4'
  expectedOutput: 'Target  Exists at Index : 1

    3 2 4'
  weight: 25
- name: Hidden 2
  input: '4 1

    1 2 3 4'
  expectedOutput: 'Target  Exists at Index : 0

    1 2 3 4'
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: 'Target Doesn''t Exists

    2 4 6 8 10'
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
editorial: '### Binary Search


  This problem evaluates core techniques in Binary Search. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void binarySearchHelper(int arr[],int target) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        binarySearchHelper(arr, target);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static void binarySearchHelper(int arr[],int target){\n            int n=arr.length;  \n            int low=0;int high=n-1;\n            int result=0; boolean isFound=false;\n            while(low<=high){\n                int mid=low+(high-low)/2;\n\n                if(arr[mid]==target){\n                    result=mid;\n                    isFound=true; break;\n                }   \n                if(arr[low]<target){\n                  low=mid+1;\n                }else{\n                   high=mid-1;\n                }\n            }\n          //   System.out.println(\"Target  Exists at : \"+result);\n            if(isFound){\n                System.out.println(\"Target  Exists at Index : \"+result);\n            } else{\n                  System.out.println(\"Target Doesn't Exists\");\n            }\n    }\n    \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n  \
  \      if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        binarySearchHelper(arr, target);\n        for (int i = 0; i < arr.length; i++) System.out.print((i > 0 ? \" \" : \"\") + arr[i]);\n        System.out.println();\n    }\n}"
---

### Binary Search

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
