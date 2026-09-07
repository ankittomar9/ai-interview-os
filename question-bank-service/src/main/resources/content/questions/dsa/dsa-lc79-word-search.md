---
slug: dsa-lc79-word-search
title: Word Search
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- backtracking
- mid
- lc-79
buildProfile: judge0
source: inspired-by:operator-corpus/Q_107_Word_Search.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3 4 ABCCED

    ABCE

    SFCS

    ADEE'
  expectedOutput: 'true'
  description: Primary test case
- name: Sample 2
  input: '3 4 SEE

    ABCE

    SFCS

    ADEE'
  expectedOutput: 'true'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 4 ABCB

    ABCE

    SFCS

    ADEE'
  expectedOutput: 'false'
  weight: 25
- name: Hidden 2
  input: '1 1 A

    A'
  expectedOutput: 'true'
  weight: 25
- name: Hidden 3
  input: '2 2 AB

    AB

    CD'
  expectedOutput: 'true'
  weight: 50
hints:
- Analyze the problem using Backtracking algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Backtracking techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Word Search


  This problem evaluates core techniques in Backtracking. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean exist(char[][] board, String word) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        String word = sc.next();\n        char[][] board = new char[r][c];\n        for (int i = 0; i < r; i++) { String row = sc.next(); for (int j = 0; j < c; j++) board[i][j] = row.charAt(j); }\n        System.out.println(exist(board, word));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static boolean exist(char[][] board, String word){\n        if(board==null || board.length==0){\n            return false;        }\n\n            for(int i=0;i<board.length;i++){\n                for(int j=0;j<board[0].length;j++){\n                    if(board[i][j]==word.charAt(0) && dfs(board, word, i, j, 0))\n                        return true;\n                    }\n            }\n            return false;\n        }\n        private static boolean dfs(char[][] board,String word,int i,int j,int index){\n            if(index ==word.length()){ return true;}\n\n            if(i<0 || i>= board.length || j<0 || j>=board[0].length || \n                board[i][j] !=word.charAt(index)){\n                    return false;\n                }\n            char temp=board[i][j];\n            board[i][j] ='#';\n\n            boolean found=dfs(board, word, i+1, j, index+1)||\n                          dfs(board, word,\
  \ i-1, j, index+1)||\n                          dfs(board, word, i, j+1, index+1)||\n                          dfs(board, word, i, j-1, index+1);\n        \n                board[i][j]=temp;\n                return found;\n           }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int r = sc.nextInt();\n        int c = sc.nextInt();\n        String word = sc.next();\n        char[][] board = new char[r][c];\n        for (int i = 0; i < r; i++) { String row = sc.next(); for (int j = 0; j < c; j++) board[i][j] = row.charAt(j); }\n        System.out.println(exist(board, word));\n    }\n}"
---

### Word Search

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
