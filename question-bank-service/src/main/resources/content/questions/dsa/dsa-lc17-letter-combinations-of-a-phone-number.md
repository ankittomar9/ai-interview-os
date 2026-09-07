---
slug: dsa-lc17-letter-combinations-of-a-phone-number
title: Letter Combinations of a Phone Number
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- backtracking
- mid
- lc-17
buildProfile: judge0
source: inspired-by:operator-corpus/Q_101_Letter_Combinations_of_a_Phone_Number.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '23'
  expectedOutput: ad ae af bd be bf cd ce cf
  description: Primary test case
- name: Sample 2
  input: '2'
  expectedOutput: a b c
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '79'
  expectedOutput: pw px py pz qw qx qy qz rw rx ry rz sw sx sy sz
  weight: 25
- name: Hidden 2
  input: '45'
  expectedOutput: gj gk gl hj hk hl ij ik il
  weight: 25
- name: Hidden 3
  input: '234'
  expectedOutput: adg adh adi aeg aeh aei afg afh afi bdg bdh bdi beg beh bei bfg bfh bfi cdg cdh cdi ceg ceh cei cfg cfh cfi
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
editorial: '### Letter Combinations of a Phone Number


  This problem evaluates core techniques in Backtracking. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static List<String> letterCombinations(String digits) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        List<String> res = letterCombinations(s);\n        if (res != null) {\n            for (int i = 0; i < res.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + res.get(i));\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class Main {\n    \n     public static List<String> letterCombinations(String digits) {\n        List<String> result=new ArrayList<>();\n        if(digits==null || digits.isEmpty()){\n            return result;        }\n            \n        String[] mapping={\n             \"\", \"\", \"abc\", \"def\", \"ghi\", \"jkl\",\n            \"mno\", \"pqrs\", \"tuv\", \"wxyz\"\n        };\n\n        backtrack(digits,0,new StringBuilder(),result,mapping);\n        return result;\n     }\n     public static void backtrack(String digits,int index,StringBuilder current,\n        List<String> result,String[] mapping){\n            if(index==digits.length()){\n                result.add(current.toString());\n                return;\n            }\n        String letters =mapping[digits.charAt(index)-'0'];\n        for(char c : letters.toCharArray()){\n            current.append(c);\n            backtrack(digits,\
  \ index+1, current, result, mapping);\n            current.deleteCharAt(current.length()-1);\n                }       \n        }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        List<String> res = letterCombinations(s);\n        if (res != null) {\n            for (int i = 0; i < res.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + res.get(i));\n            System.out.println();\n        }\n    }\n}"
---

### Letter Combinations of a Phone Number

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
