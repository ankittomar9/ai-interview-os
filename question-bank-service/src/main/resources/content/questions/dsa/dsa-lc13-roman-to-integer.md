---
slug: dsa-lc13-roman-to-integer
title: Roman to Integer
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- math
- junior
- lc-13
buildProfile: judge0
source: inspired-by:operator-corpus/Q_17_Roman_to_Integer.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '42'
  expectedOutput: '0'
  description: Primary test case
- name: Sample 2
  input: '-42'
  expectedOutput: '0'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '4193'
  expectedOutput: '0'
  weight: 25
- name: Hidden 2
  input: '0'
  expectedOutput: '0'
  weight: 25
- name: Hidden 3
  input: '9128'
  expectedOutput: '0'
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
editorial: '### Roman to Integer


  This problem evaluates core techniques in Math. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int romanToInt(String s) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(romanToInt(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n     private static int valueOf(char c) {\n        switch (c) {\n            case 'I': return 1;   case 'V': return 5;  case 'X': return 10;  case 'L': return 50;\n         case 'C': return 100; case 'D': return 500; case 'M': return 1000;  default:  return 0;}\n        }\n    public static int romanToInt(String s){\n        if(s==null || s.length()==0){return 0;}\n\n        int n=s.length();\n        int result=0;\n\n        for(int i=0;i<n;i++){\n            int current=valueOf(s.charAt(i));\n\n            if(i+1 < n  && current < valueOf(s.charAt(i+1))){\n                result=result-current;\n            }else{\n                result=result+current;\n            }\n            \n        }\n        return result;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(romanToInt(s));\n\
  \    }\n}"
---

### Roman to Integer

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
