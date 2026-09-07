---
slug: dsa-lc224-basic-calculator
title: Basic Calculator
track: ALGORITHMS_DATA_STRUCTURES
difficulty: SENIOR
tags:
- stack
- senior
- lc-224
buildProfile: judge0
source: inspired-by:operator-corpus/Q_56_Basic_Calculator.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: '0'
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: '0'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: '0'
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: '0'
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
editorial: '### Basic Calculator


  This problem evaluates core techniques in Stack. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int calculate(String s) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(calculate(s));\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Stack;\npublic class Main {\n    \n    public static int calculate(String s){\n        Stack<Integer> stack=new Stack<>();\n        int result=0; int sign=1; int num=0;\n    \n        for(int i=0;i<s.length();i++){\n            char c=s.charAt(i);\n\n            if(Character.isDigit(c)){\n                num=num * 10 + (c -'0');\n            }\n            else if(c == '+'){\n                result=result + (sign *num);\n                num=0; sign=1;\n            }\n            else if(c == '-'){\n                result=result + (sign *num);\n                num=0; sign=-1;\n            }\n\n            else if( c == '('){\n                stack.push(result);\n                stack.push(sign);\n                result=0;\n                sign=1;\n            }\n            else if( c == ')'){\n                result =result +(sign * num);\n                num=0;\n                int savedSign=stack.pop();\n                int savedResult=stack.pop();\n\
  \                result=savedResult +(savedSign *result);\n            }\n        }\n        if(num !=0){\n            result=result +(sign *num);\n        }\n        return result;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(calculate(s));\n    }\n}"
---

### Basic Calculator

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
