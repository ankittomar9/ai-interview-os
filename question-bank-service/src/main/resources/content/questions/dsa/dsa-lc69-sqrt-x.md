---
slug: dsa-lc69-sqrt-x
title: Sqrt(x)
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- binary-search
- junior
- lc-69
buildProfile: judge0
source: inspired-by:operator-corpus/Q_134_Sqrt_x.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: '2'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: '3'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: '2'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: '3'
  weight: 50
hints:
- Analyze the problem using Binary Search algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Binary Search techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Sqrt(x)


  This problem evaluates core techniques in Binary Search. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int mySqrt(int x) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(mySqrt(n));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static int mySqrt(int x){\n        if(x==0 || x==1){return x;}\n\n        long left=1; long right=x;\n\n        while(left<=right){\n            long mid=left+(right-left)/2;\n            long square=mid*mid;\n\n            if(square ==x){\n                return (int)mid;\n            }\n            else if(square<x){\n                left=mid+1;\n            }else{\n                right=mid-1;\n            }\n        }\n        return (int) right;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        System.out.println(mySqrt(n));\n    }\n}"
---

### Sqrt(x)

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
