---
slug: dsa-lc76-minimum-window-substring
title: Minimum Window Substring
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [sliding-window, strings]
est_minutes: 40
tags:
- sliding-window
- senior
- lc-76
buildProfile: judge0
source: inspired-by:operator-corpus/Q_33_Minimum_Window_Substring.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: anagram nagaram
  expectedOutput: anagram
  description: Primary test case
- name: Sample 2
  input: rat car
  expectedOutput: ''
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: listen silent
  expectedOutput: listen
  weight: 25
- name: Hidden 2
  input: hello world
  expectedOutput: ''
  weight: 25
- name: Hidden 3
  input: abc cba
  expectedOutput: abc
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
editorial: '### Minimum Window Substring


  This problem evaluates core techniques in Sliding Window. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String minWindow(String s,String t) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(minWindow(s1, s2));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static String minWindow(String s,String t){\n        if(s==null || t==null || s.length()<t.length()){return \"\";}\n\n        int[] count=new int[128]; //build freq hashmap for t\n        for(int i=0;i<t.length();i++){\n            char c=t.charAt(i);\n            count[c]++;\n        }\n        int left=0; int minLen=Integer.MAX_VALUE; int minStart=0; int required=t.length();\n\n        for(int right=0; right<s.length();right++){\n            char r=s.charAt(right);\n\n            if(count[r]>0){\n                required--;\n            }\n            count[r]--;\n\n            while(required ==0 ){\n                int windowLen=right-left+1;\n                if(windowLen<minLen){\n                    minLen=windowLen;\n                    minStart=left;\n                }\n\n                char l=s.charAt(left);\n                count[l]++;\n                if(count[l]>0){\n                    required++;\n\
  \                }\n                left++;\n            }\n        }\n        if (minLen==Integer.MAX_VALUE) {\n            return \"\";\n        } else {\n            return s.substring(minStart, minStart + minLen);\n        }\n\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s1 = sc.next();\n        String s2 = sc.next();\n        System.out.println(minWindow(s1, s2));\n    }\n}"
---

### Minimum Window Substring

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
