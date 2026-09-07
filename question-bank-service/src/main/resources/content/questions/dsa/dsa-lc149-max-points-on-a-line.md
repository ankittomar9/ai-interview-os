---
slug: dsa-lc149-max-points-on-a-line
title: Max Points on a Line
track: ALGORITHMS_DATA_STRUCTURES
difficulty: SENIOR
tags:
- math
- senior
- lc-149
buildProfile: judge0
source: inspired-by:operator-corpus/Q_136_Max_Points_on_a_Line.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 3

    1 2 3

    4 5 6

    7 8 9'
  expectedOutput: '3'
  description: Primary test case
- name: Sample 2
  input: '2 3

    1 0 1

    0 1 0'
  expectedOutput: '2'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    2 4

    6 8

    10 12'
  expectedOutput: '3'
  weight: 25
- name: Hidden 2
  input: '2 2

    1 2

    3 4'
  expectedOutput: '2'
  weight: 25
- name: Hidden 3
  input: '3 3

    9 8 7

    6 5 4

    3 2 1'
  expectedOutput: '3'
  weight: 50
hints:
- Analyze the problem using Math algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Math techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Max Points on a Line


  This problem evaluates core techniques in Math. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int maxPoints(int[][] points) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(maxPoints(mat));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\nimport java.util.HashMap;\nimport java.util.Map;\n\npublic class Main {\n    \n    public static int maxPoints(int[][] points){\n        if(points.length<=2){return points.length;}\n        int maxPoints=0;\n    \n        for(int i=0;i<points.length;i++){\n            Map<String,Integer> slopeCount=new HashMap<>();\n            int duplicates=1; int localMax=0;\n        \n            for(int j=i+1;j<points.length;j++){\n                int dx=points[j][0]-points[i][0];\n                int dy=points[j][1]-points[i][1];\n\n                if(dx==0 && dy==0){\n                    duplicates++; \n                    continue;\n                }\n                int gcd=gcd(dx,dy);\n                dx=dx/gcd;\n                dy=dy/gcd;\n\n                if(dx<0){\n                    dx=-dx; \n                    dy=-dy;\n                }else if(dx==0 && dy<0){\n                    dy=-dy;\n                }\n\n             \
  \   String key=dx + \"/\"+ dy;\n              slopeCount.put(key, slopeCount.getOrDefault(key, 0) + 1);\n        \n                localMax=Math.max(localMax, slopeCount.get(key));\n            }\n            maxPoints=Math.max(maxPoints, localMax+duplicates);\n        }\n        return maxPoints;\n    }\n    private static int gcd(int a,int b){\n        return b==0 ? a: gcd(b,a%b);\n    }\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        int[][] mat = new int[r][c];\n        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) mat[i][j] = sc.nextInt();\n        System.out.println(maxPoints(mat));\n    }\n}"
---

### Max Points on a Line

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
