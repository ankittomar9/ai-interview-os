---
slug: dsa-determine-the-length-of-a-string-without-length
title: Determine the Length of a string without `length()`.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_69_String_Length_Without_Method.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: '5'
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: '7'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: '9'
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: '4'
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: '9'
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
editorial: '### Determine the Length of a string without `length()`.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int findLength(String str) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(findLength(s));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static int findLength(String str) {\n        // Edge case for null strings to prevent NullPointerException\n        if (str == null) return 0;\n        int i=0;\n        try {\n           // we cross the threshold intentionally\n            while (true) {\n                // This will eventually fail when 'i' reaches the actual length\n                str.charAt(i); \n                i++;\n            }\n        } catch (StringIndexOutOfBoundsException e) {\n            // We fell off the cliff! The catch block acts as our safety net.\n            // The moment it breaks, 'i' holds the exact length of the string.\n        }\n        return i;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(findLength(s));\n    }\n}"
---

### Determine the Length of a string without `length()`.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
