---
slug: dsa-arrays-2d-scalar-product
title: Arrays 2D Scalar Product
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [matrix, arrays]
est_minutes: 25
tags:
- matrix
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_31_Arrays_2D_Scalar_product.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3 5

    1 2 3

    4 5 6

    7 8 9'
  expectedOutput: "matrix after product : \n[[5, 10, 15], [20, 25, 30], [35, 40, 45]]\n5 10 15 \n20 25 30 \n35 40 45"
  description: Primary test case
- name: Sample 2
  input: '2 3 0

    1 0 1

    0 1 0'
  expectedOutput: "matrix after product : \n[[0, 0, 0], [0, 0, 0]]\n0 0 0 \n0 0 0"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2 8

    2 4

    6 8

    10 12'
  expectedOutput: "matrix after product : \n[[16, 32], [48, 64], [80, 96]]\n16 32 \n48 64 \n80 96"
  weight: 25
- name: Hidden 2
  input: '2 2 3

    1 2

    3 4'
  expectedOutput: "matrix after product : \n[[3, 6], [9, 12]]\n3 6 \n9 12"
  weight: 25
- name: Hidden 3
  input: '3 3 99

    9 8 7

    6 5 4

    3 2 1'
  expectedOutput: "matrix after product : \n[[891, 792, 693], [594, 495, 396], [297, 198, 99]]\n891 792 693 \n594 495 396 \n297 198 99"
  weight: 50
hints:
- Analyze the problem using Matrix algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Matrix techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Arrays 2D Scalar Product


  This problem evaluates core techniques in Matrix. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void scalarProductHelper(int arr[][],int k) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int target = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        scalarProductHelper(mat, target);\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static void scalarProductHelper(int arr[][],int k){\n        if(arr==null || arr.length==0){return ;}\n            int n=arr.length;\n            int m=arr[0].length;\n        for(int i=0;i<n;i++){\n             for(int j=0;j<m;j++){\n                arr[i][j]=arr[i][j]*k;\n             }   \n            }\n         System.out.println(\" matrix after product : \\n\"+Arrays.deepToString(arr));\n            printMatrix(arr);\n    }\n    public static void printMatrix(int arr[][]){\n         int n=arr.length;\n            int m=arr[0].length;\n            for(int i=0;i<n;i++){\n             for(int j=0;j<m;j++){\n                System.out.print(arr[i][j]+\" \");\n             }   \n            System.out.println();\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n\
  \        int c = sc.nextInt();\n        int target = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        scalarProductHelper(mat, target);\n    }\n}"
---

### Arrays 2D Scalar Product

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
