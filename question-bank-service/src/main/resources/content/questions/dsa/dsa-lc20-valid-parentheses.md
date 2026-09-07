---
slug: dsa-lc20-valid-parentheses
title: Valid Parentheses
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [stacks-queues]
est_minutes: 15
tags:
- stack
- junior
- lc-20
buildProfile: judge0
source: inspired-by:operator-corpus/Q_52_Valid_Parentheses.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: 'false'
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: 'false'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: 'false'
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: 'false'
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: 'false'
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
editorial: '### Valid Parentheses


  This problem evaluates core techniques in Stack. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean isValid(String s) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(isValid(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Stack;\n\npublic class Main {\n    \n    public static boolean isValid(String s){\n        if(s==null || s.length() %2!=0){            return false;        }\n\n        Stack<Character> stack=new Stack<>();\n\n        char[] charArr=s.toCharArray();\n\n        for(int i=0;i<s.length();i++){\n            if(charArr[i]=='(' || charArr[i]=='{' || charArr[i]=='[' ){\n                stack.push(charArr[i]);\n            }else{\n                if(stack.isEmpty()){\n                    return false;\n                }\n            char top=stack.pop();\n            if((charArr[i]==')' && top!='(')||\n                charArr[i]=='}' && top!='{' ||\n                charArr[i]==']' && top!='['){\n                    return false;\n                }    \n            }\n        }\n        return stack.isEmpty();\n\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        String s = sc.next();\n        System.out.println(isValid(s));\n    }\n}"
---

### Valid Parentheses

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
