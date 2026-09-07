---
slug: dsa-lc202-happy-number
title: Happy Number
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [math, hashing]
est_minutes: 15
tags:
- math--hash-map
- junior
- lc-202
buildProfile: judge0
source: inspired-by:operator-corpus/Q_45_Happy_Number_1.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 'false'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 'true'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: 'true'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 'true'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 'false'
  weight: 50
hints:
- Analyze the problem using Math / Hash Map algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Math / Hash Map techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Happy Number


  This problem evaluates core techniques in Math / Hash Map. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean isHappy(int n) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(isHappy(n));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static boolean isHappy(int n){\n       int slow=n;\n        int fast=getNext(n);\n\n      while (fast != 1 && slow != fast) {\n            slow=getNext(slow);              \n            fast=getNext(getNext(fast));    \n        }\n         return fast == 1;\n    }\n    private static int getNext(int n){\n        int sum=0;\n        while(n>0){\n            int extract=n%10;\n            sum=sum+extract*extract;\n            n=n/10;\n        }\n        return sum;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(isHappy(n));\n    }\n}"
---

### Happy Number

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
