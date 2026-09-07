---
slug: dsa-find-the-longest-palindromic-substring-basic-approach
title: Find the Longest Palindromic Substring (Basic approach).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_88_Longest_Palindromic_Substring.java
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
  expectedOutput: m
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: noon
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: w
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
editorial: '### Find the Longest Palindromic Substring (Basic approach).


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static String longestPalindrome(String str) {\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(longestPalindrome(s));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static String longestPalindrome(String str){\n        if(str==null || str.length()<1){return \"\";}\n        int start=0;int end=0;\n        for(int i=0;i<str.length();i++){\n\n            int len1=expandFromCenter(str,i,i);\n                int len2=expandFromCenter(str,i,i+1);\n        \n                int len=Math.max(len1,len2);\n                if(len>end-start){\n                    start=i-(len-1)/2;\n                    end=i+len/2;\n                }\n             } \n             return str.substring(start,end+1);\n    }\n    public static int expandFromCenter(String str ,int left,int right){\n        while(left>=0 && right< str.length() && str.charAt(left)== str.charAt(right)){\n            left--;\n            right++;\n        }\n        return right-left-1;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n      \
  \  String s = sc.next();\n        System.out.println(longestPalindrome(s));\n    }\n}"
---

### Find the Longest Palindromic Substring (Basic approach).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
