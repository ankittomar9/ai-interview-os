---
slug: dsa-lc71-simplify-path
title: Simplify Path
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [stacks-queues]
est_minutes: 25
tags:
- stack
- mid
- lc-71
buildProfile: judge0
source: inspired-by:operator-corpus/Q_53_Simplify_Path.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: /hello
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: /racecar
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: /algorithm
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: /noon
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: /interview
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
editorial: '### Simplify Path


  This problem evaluates core techniques in Stack. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String simplifyPath(String path) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(simplifyPath(s));\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.Stack;\npublic class Main {\n    \n    public static String simplifyPath(String path){\n        Stack<String>  stack=new  Stack<>();\n        String[] parts=path.split(\"/\");\n\n        for(int i=0;i<parts.length;i++){\n            String part=parts[i];\n        \n            if(part.isEmpty() || part.equals(\".\")){ continue;}\n            if(part.equals(\"..\")){\n            if(!stack.isEmpty()){\n                stack.pop();\n            }\n        }\n        else{\n            stack.push(part);\n        }\n     }\n        if(stack.isEmpty()){\n            return \"/\";\n        }\n        StringBuilder result=new StringBuilder();\n        for(int i=0;i<stack.size();i++){\n            result.append(\"/\").append(stack.get(i));\n        }    \n        return result.toString();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s =\
  \ sc.next();\n        System.out.println(simplifyPath(s));\n    }\n}\n\n"
---

### Simplify Path

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
