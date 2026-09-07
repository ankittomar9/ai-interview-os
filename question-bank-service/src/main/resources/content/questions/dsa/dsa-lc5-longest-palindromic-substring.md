---
slug: dsa-lc5-longest-palindromic-substring
title: Longest Palindromic Substring
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- two-pointers--dp
- mid
- lc-5
buildProfile: judge0
source: inspired-by:operator-corpus/Q_145_Longest_Palindromic_Substring.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: ll
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: racecar
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: a
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: noon
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: i
  weight: 50
hints:
- Analyze the problem using Two Pointers / DP algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Two Pointers / DP techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Longest Palindromic Substring


  This problem evaluates core techniques in Two Pointers / DP. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String longestPalindrome(String s) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(longestPalindrome(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static String longestPalindrome(String s){\n        if(s==null ||s.length()<2){ return s;}\n\n        int start=0,maxLen=1;\n\n        for(int i=0;i<s.length();i++){\n            int len1=expandAroundCenter(s,i,i);\n            int len2=expandAroundCenter(s,i,i+1);\n\n            int len=Math.max(len1,len2);\n\n            if(len>maxLen){\n                maxLen=len;\n                start=i-(len-1)/2;\n            }\n        }\n        return s.substring(start,start+maxLen);\n    }\n    private static int expandAroundCenter(String s,int left,int right){\n        while(left>=0 && right<s.length() && s.charAt(left)==s.charAt(right)){\n            left--;\n            right++;\n        }\n        return right-left-1;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(longestPalindrome(s));\n\
  \    }\n}"
---

### Longest Palindromic Substring

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
