---
slug: dsa-lc72-edit-distance
title: Edit Distance
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- dynamic-programming
- mid
- lc-72
buildProfile: judge0
source: inspired-by:operator-corpus/Q_147_Edit_Distance.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: anagram nagaram
  expectedOutput: '2'
  description: Primary test case
- name: Sample 2
  input: rat car
  expectedOutput: '2'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: listen silent
  expectedOutput: '4'
  weight: 25
- name: Hidden 2
  input: hello world
  expectedOutput: '4'
  weight: 25
- name: Hidden 3
  input: abc cba
  expectedOutput: '2'
  weight: 50
hints:
- Analyze the problem using Dynamic Programming algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Dynamic Programming techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Edit Distance


  This problem evaluates core techniques in Dynamic Programming. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int minDistance(String word1,String word2) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(minDistance(s1, s2));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static int minDistance(String word1,String word2){\n        int m=word1.length();int n=word2.length();\n\n        int[][] dp=new int[m+1][n+1];\n\n        for(int i=1;i<=m;i++){\n            dp[i][0]=i;\n        }\n        for(int j=1;j<=n;j++){\n            dp[0][j]=j;\n        }\n\n        for(int i=1;i<=m;i++){\n            for(int j=1;j<=n;j++){\n                if(word1.charAt(i-1) ==word2.charAt(j-1)){\n                    dp[i][j]=dp[i-1][j-1];\n                }else{\n                    int result1=Math.min(dp[i][j-1], dp[i-1][j-1]);\n                    int result2=Math.min(dp[i-1][j],result1);\n                    dp[i][j]=1+result2;\n                }\n            }\n        }\n        return dp[m][n];\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n\
  \        System.out.println(minDistance(s1, s2));\n    }\n}"
---

### Edit Distance

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
