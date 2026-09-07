---
slug: dsa-lc125-valid-palindrome
title: Valid Palindrome
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- strings
- junior
- lc-125
buildProfile: judge0
source: inspired-by:operator-corpus/Q_25_Valid_Palindrome.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: 'false'
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: 'true'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: 'false'
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: 'true'
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: 'false'
  weight: 50
hints:
- Analyze the problem using Strings algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Strings techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Valid Palindrome


  This problem evaluates core techniques in Strings. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean isPalindrome(String s) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(isPalindrome(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static boolean isPalindrome(String s){\n        if(s==null || s.isEmpty()){return true;}\n        int left=0;int right=s.length()-1;\n\n        while(left<right){\n            while(left<right && !Character.isLetterOrDigit(s.charAt(left))){\n                left++;\n            }\n\n             while(left<right && !Character.isLetterOrDigit(s.charAt(right))){\n                right--;\n            }\n\n            if (Character.toLowerCase(s.charAt(left)) !=\n             Character.toLowerCase(s.charAt(right))) {\n                return false;\n            }\n\n            left++;\n            right--;\n        }\n        return true;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(isPalindrome(s));\n    }\n}"
---

### Valid Palindrome

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
