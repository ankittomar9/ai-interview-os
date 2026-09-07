---
slug: dsa-lc49-group-anagrams
title: Group Anagrams
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [hashing, arrays]
est_minutes: 25
tags:
- arrays--hashing
- mid
- lc-49
buildProfile: judge0
source: inspired-by:operator-corpus/Q_43_Group_Anagrams.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4

    flower flow flight flag'
  expectedOutput: '[flower] [flight] [flag] [flow]'
  description: Primary test case
- name: Sample 2
  input: '3

    dog racecar car'
  expectedOutput: '[racecar] [car] [dog]'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '2

    hello world'
  expectedOutput: '[hello] [world]'
  weight: 25
- name: Hidden 2
  input: '5

    a b c d e'
  expectedOutput: '[a] [b] [c] [d] [e]'
  weight: 25
- name: Hidden 3
  input: '3

    abc ab a'
  expectedOutput: '[ab] [a] [abc]'
  weight: 50
hints:
- Analyze the problem using Arrays & Hashing algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Arrays & Hashing techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Group Anagrams


  This problem evaluates core techniques in Arrays & Hashing. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static List<List<String>> groupAnagrams(String[] strs) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        String[] arr = new String[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.next();\n        List<List<String>> res = groupAnagrams(arr);\n        if (res != null) {\n            for (int i = 0; i < res.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + res.get(i));\n            System.out.println();\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.HashMap;\nimport java.util.List;\nimport java.util.Map;\n\npublic class Main {\n    \n    public static List<List<String>> groupAnagrams(String[] strs){\n        if(strs==null || strs.length==0){ return new ArrayList<>();}\n        Map<String ,List<String>>map=new HashMap<>();\n\n        for(int i=0;i<strs.length;i++){\n            String str=strs[i];\n\n            char[] chars=str.toCharArray();\n            Arrays.sort(chars);\n            String key=new String(chars);\n            \n            if(!map.containsKey(key)){\n                map.put(key, new ArrayList<>());\n            }\n            map.get(key).add(str);\n        }\n        return new ArrayList<>(map.values());\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        String[] arr = new String[n];\n\
  \        for (int i = 0; i < n; i++) arr[i] = sc.next();\n        List<List<String>> res = groupAnagrams(arr);\n        if (res != null) {\n            for (int i = 0; i < res.size(); i++) System.out.print((i > 0 ? \" \" : \"\") + res.get(i));\n            System.out.println();\n        }\n    }\n}"
---

### Group Anagrams

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
