---
slug: dsa-lc108-convert-sorted-array-to-binary-search-tree
title: Convert Sorted Array to Binary Search Tree
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [trees, binary-search, arrays]
est_minutes: 15
tags:
- binary-search-tree
- junior
- lc-108
buildProfile: judge0
source: inspired-by:operator-corpus/Q_108_Convert_Sorted_Array_to_Binary_Search_Tree.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    1 2 3 4 5'
  expectedOutput: 3 1 4 2 5
  description: Primary test case
- name: Sample 2
  input: '4

    4 2 1 3'
  expectedOutput: 2 4 1 3
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '6

    -2 1 -3 4 -1 2'
  expectedOutput: -3 -2 -1 1 4 2
  weight: 25
- name: Hidden 2
  input: '3

    10 10 10'
  expectedOutput: 10 10 10
  weight: 25
- name: Hidden 3
  input: '5

    5 4 3 2 1'
  expectedOutput: 3 5 2 4 1
  weight: 50
hints:
- Analyze the problem using Binary Search Tree algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Binary Search Tree techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Convert Sorted Array to Binary Search Tree


  This problem evaluates core techniques in Binary Search Tree. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static TreeNode sortedArrayToBST(int[] nums) {\n        return null;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        TreeNode res = sortedArrayToBST(arr);\n        if (res == null) System.out.println(\"null\");\n        else {\n            Queue<TreeNode> q = new LinkedList<>();\n            q.offer(res);\n            StringBuilder sb = new StringBuilder();\n            while (!q.isEmpty()) {\n                TreeNode c = q.poll();\n                if (c != null) { sb.append(c.val).append(\" \"); q.offer(c.left); q.offer(c.right); }\n            }\n            System.out.println(sb.toString().trim());\n        }\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static TreeNode sortedArrayToBST(int[] nums){\n        if(nums==null || nums.length==0){return null;}\n        return buildBST(nums, 0, nums.length-1);\n    }\n    public static class TreeNode{\n        int val;TreeNode left; TreeNode right;\n        TreeNode(){} TreeNode(int val){this.val=val;}\n        TreeNode(int val,TreeNode left,TreeNode right){\n            this.val=val;\n            this.left=left;\n            this.right=right;\n        }\n    }\n    public static TreeNode buildBST(int[] nums,int left,int right){\n        if(left>right) return null;\n        \n        int mid=left+(right-left)/2;\n        TreeNode root=new TreeNode(nums[mid]);\n        \n        root.left=buildBST(nums, left, mid-1);\n        root.right=buildBST(nums, mid+1, right);\n        \n        return root;\n    }\n    public static void printInorder(TreeNode node){\n        if(node==null){return;}\n        printInorder(node.left);\n\
  \        System.out.print(node.val+\" \");\n        printInorder(node.right);\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        TreeNode res = sortedArrayToBST(arr);\n        if (res == null) System.out.println(\"null\");\n        else {\n            Queue<TreeNode> q = new LinkedList<>();\n            q.offer(res);\n            StringBuilder sb = new StringBuilder();\n            while (!q.isEmpty()) {\n                TreeNode c = q.poll();\n                if (c != null) { sb.append(c.val).append(\" \"); q.offer(c.left); q.offer(c.right); }\n            }\n            System.out.println(sb.toString().trim());\n        }\n    }\n}"
---

### Convert Sorted Array to Binary Search Tree

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
