---
slug: dsa-lc3-longest-substring-without-repeating-characters
title: Longest Substring Without Repeating Characters
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [sliding-window, strings]
est_minutes: 25
tags:
- sliding-window
- mid
- lc-3
buildProfile: judge0
source: inspired-by:operator-corpus/Q_31_Longest_Substring_Without_Repeating_Characters_1.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: '3'
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: '4'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: '9'
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: '2'
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: '6'
  weight: 50
hints:
- Analyze the problem using Sliding Window algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Sliding Window techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Longest Substring Without Repeating Characters


  This problem evaluates core techniques in Sliding Window. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(lengthOfLongestSubstring(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n\n    public static int lengthOfLongestSubstring(String s){\n        if(s==null || s.isEmpty()){\n            return 0;\n        }\n\n        int[] charArr=new int[128];\n        Arrays.fill(charArr, -1);\n\n        int left=0;int maxLen=0;\n        for(int right=0;right<s.length();right++){\n            char c=s.charAt(right);\n            if(charArr[c]!=-1){\n                left=Math.max(left, charArr[c]+1);\n            }\n            charArr[c]=right;\n            int newLength=right-left+1;\n            maxLen=Math.max(maxLen, newLength);\n        }\n        return maxLen;\n    }\n\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(lengthOfLongestSubstring(s));\n    }\n}"
---

### Longest Substring Without Repeating Characters

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
