---
slug: dsa-lc135-candy
title: Candy
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [greedy]
est_minutes: 40
tags:
- greedy
- senior
- lc-135
buildProfile: judge0
source: inspired-by:operator-corpus/Q_15_Candy.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: '15'
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: '8'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: '9'
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: '3'
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: '15'
  weight: 50
hints:
- Analyze the problem using Greedy algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Greedy techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Candy


  This problem evaluates core techniques in Greedy. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static long candy(int[] ratings) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(candy(arr));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static long candy(int[] ratings){\n        int n=ratings.length;\n        if(n==0) return 0;\n\n        int[] candies=new int[n];\n        Arrays.fill(candies,1);\n\n        for(int i=1;i<ratings.length;i++){\n                if(ratings[i]>ratings[i-1]){\n                    candies[i]=candies[i-1]+1;\n                }\n        }\n\n        for(int i=n-2;i>=0;i--){\n            if(ratings[i]>ratings[i+1]){\n                int moreCandies=candies[i+1]+1;\n                    candies[i]=Math.max(candies[i],moreCandies);\n            }\n        }\n\n        long total=0;\n        for(int i=0;i<candies.length;i++){\n            total=total+candies[i];\n        }\n        return total;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n   \
  \     for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(candy(arr));\n    }\n}"
---

### Candy

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
