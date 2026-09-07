---
slug: dsa-lc85-maximal-rectangle
title: Maximal Rectangle
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [stacks-queues]
est_minutes: 40
tags:
- stack
- senior
- lc-85
buildProfile: judge0
source: inspired-by:operator-corpus/Q_44_Maximal_Rectangle.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3

    111

    010

    111'
  expectedOutput: '3'
  description: Primary test case
- name: Sample 2
  input: '2 2

    XX

    OO'
  expectedOutput: '0'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 3

    ABC

    DEF

    GHI'
  expectedOutput: '0'
  weight: 25
- name: Hidden 2
  input: '1 1

    X'
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: '2 3

    101

    010'
  expectedOutput: '1'
  weight: 50
hints:
- Analyze the problem using Stack algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Stack techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Maximal Rectangle


  This problem evaluates core techniques in Stack. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int maximalRectangle(char[][] matrix) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        char[][] mat = new char[r][c];\n        for (int i = 0; i < r; i++) { String row = sc.next(); for (int j = 0; j < c; j++) mat[i][j] = row.charAt(j); }\n        System.out.println(maximalRectangle(mat));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayDeque;\nimport java.util.Deque;\n\npublic class Main {\n    \n    public static int maximalRectangle(char[][] matrix){\n        if(matrix==null || matrix.length==0){ return 0;}\n        int rows=matrix.length;        int cols=matrix[0].length;\n        int[] heights=new int[cols];         int maxArea=0;\n\n        for(int i=0;i<rows;i++){\n            for(int j=0;j<cols;j++){\n              if(matrix[i][j]=='1'){\n                heights[j]=heights[j]+1;\n              }else{\n                heights[j]=0;\n              }\n            }\n            maxArea=Math.max(maxArea, largestRectangleHistogram(heights, i));\n        }\n        return maxArea;\n    }\n    public static int largestRectangleHistogram(int[] heights,int n){\n         int[] h = new int[heights.length + 1];\n      // int[] h=new int[n+1];\n        System.arraycopy(heights, 0, h, 0, heights.length);\n        Deque<Integer> stack=new ArrayDeque<>();\n        int\
  \ maxArea=0;\n\n        for(int i=0;i<=heights.length;i++){\n            while(!stack.isEmpty() && h[i]  < h[stack.peek()]){\n                int height=h[stack.pop()];\n\n                int width;\n                if(stack.isEmpty()){   width=i;      }else{ width=i-stack.peek()-1;}\n                maxArea=Math.max(maxArea,height*width);\n            }\n            stack.push(i);\n        }\n        return maxArea;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        char[][] mat = new char[r][c];\n        for (int i = 0; i < r; i++) { String row = sc.next(); for (int j = 0; j < c; j++) mat[i][j] = row.charAt(j); }\n        System.out.println(maximalRectangle(mat));\n    }\n}"
---

### Maximal Rectangle

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
