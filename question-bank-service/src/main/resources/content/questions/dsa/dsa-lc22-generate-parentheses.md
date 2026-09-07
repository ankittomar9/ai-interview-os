---
slug: dsa-lc22-generate-parentheses
title: Generate Parentheses
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- backtracking
- mid
- lc-22
buildProfile: judge0
source: inspired-by:operator-corpus/Q_106_Generate_Parentheses.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '1'
  expectedOutput: ()
  description: Primary test case
- name: Sample 2
  input: '2'
  expectedOutput: (()) ()()
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3'
  expectedOutput: ((())) (()()) (())() ()(()) ()()()
  weight: 25
- name: Hidden 2
  input: '4'
  expectedOutput: (((()))) ((()())) ((())()) ((()))() (()(())) (()()()) (()())() (())(()) (())()() ()((())) ()(()()) ()(())() ()()(()) ()()()()
  weight: 25
- name: Hidden 3
  input: '2'
  expectedOutput: (()) ()()
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
editorial: '### Generate Parentheses


  This problem evaluates core techniques in Backtracking. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static List<String> generateParenthesis(int n) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        List<String> res = generateParenthesis(n);\n        if (res != null) {\n            for (int i = 0; i < res.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + res.get(i));\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class Main {\n    \n    public static List<String> generateParenthesis(int n){\n        List<String> result=new ArrayList<>();\n        backtrack(result,new StringBuilder(),0,0,n);\n        return result;\n    }\n    public static void backtrack(List<String> result,StringBuilder current,\n        int open,int close,int max){\n            if(current.length()==max*2){\n                result.add(current.toString());\n                return;\n            }\n\n            if(open < max){\n                current.append('(');\n                backtrack(result, current, open+1, close, max);\n                current.deleteCharAt(current.length()-1);\n            }\n\n            if(close<open){\n                current.append(')');\n                backtrack(result, current, open, close+1, max);\n                current.deleteCharAt(current.length()-1);\n            }\n        }\n\n    public static\
  \ void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        List<String> res = generateParenthesis(n);\n        if (res != null) {\n            for (int i = 0; i < res.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + res.get(i));\n            System.out.println();\n        }\n    }\n}"
---

### Generate Parentheses

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
