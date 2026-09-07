---
slug: dsa-lc16-3sum-closest
title: 3Sum Closest
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- two-pointers
- mid
- lc-16
buildProfile: judge0
source: inspired-by:operator-corpus/Q_6_3Sum_Closest.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    2 7 11 15'
  expectedOutput: '20'
  description: Primary test case
- name: Sample 2
  input: '5 3

    1 2 3 4 5'
  expectedOutput: '6'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 2

    3 2 4'
  expectedOutput: '9'
  weight: 25
- name: Hidden 2
  input: '4 1

    1 2 3 4'
  expectedOutput: '6'
  weight: 25
- name: Hidden 3
  input: '5 4

    2 4 6 8 10'
  expectedOutput: '12'
  weight: 50
hints:
- Analyze the problem using Two Pointers algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Two Pointers techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### 3Sum Closest


  This problem evaluates core techniques in Two Pointers. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int threeSumClosest(int[] nums,int target) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(threeSumClosest(arr, target));\n    }\n}\n"
solutionCode: "import java.util.*;\n\nimport java.util.Arrays;\n\npublic class Main {\n    \n    public static int threeSumClosest(int[] nums,int target){\n        if(nums==null || nums.length==0){ return 0;}\n    \n        Arrays.sort(nums);        int n=nums.length;\n        int closestSum=nums[0]+nums[1]+nums[2];\n\n        for(int i=0;i<n-2;i++){\n            int leftPtr=i+1;\n            int rightPtr=n-1;\n        \n            \n            while(leftPtr<rightPtr){\n                int sum=nums[i]+nums[leftPtr]+nums[rightPtr];\n            \n                if(Math.abs(sum-target) <Math.abs(closestSum-target)){\n                    closestSum=sum;\n                }\n\n                if(sum==target){\n                    return sum;\n                }\n                else if(sum<target){\n                    leftPtr++;\n                }else{\n                    rightPtr--;\n                }\n            }\n            \n        }\n            return closestSum;\n    }\n\n\n\n\
  \    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        System.out.println(threeSumClosest(arr, target));\n    }\n}"
---

### 3Sum Closest

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
