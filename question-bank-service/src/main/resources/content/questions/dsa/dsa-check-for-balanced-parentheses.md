---
slug: dsa-check-for-balanced-parentheses
title: Check for Balanced Parentheses.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_100_Balanced_Parentheses.java
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
- Analyze the problem using 3. Strings (The "Tricky" Part - 35 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 3. Strings (The "Tricky" Part - 35 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Check for Balanced Parentheses.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean isValid(String s) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(isValid(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Stack;\n\npublic class Main {\n    \n    public static boolean isValid(String s){\n        if(s==null || s.length()%2!=0){return false;}\n\n        Stack<Character> stack =new Stack<>();\n        \n        for(int i=0;i<s.length();i++){\n            char ch=s.charAt(i);\n\n            if(ch=='('){\n                stack.push(')');\n            }else if(ch=='{'){\n                stack.push('}');\n            }else if(ch=='['){\n                stack.push(']');\n            }else{\n                if(stack.isEmpty() || stack.pop() !=ch){return false;}\n            }\n        }\n        return stack.isEmpty();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(isValid(s));\n    }\n}"
---

### Check for Balanced Parentheses.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
