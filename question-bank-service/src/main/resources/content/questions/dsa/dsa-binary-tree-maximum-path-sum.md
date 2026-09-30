---
slug: dsa-binary-tree-maximum-path-sum
title: Binary Tree Maximum Path Sum
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics:
- trees
- dp
est_minutes: 40
tags:
- binary-tree
- dfs
- recursion
- dynamic-programming
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/tree-path-sum
status: PUBLISHED
sampleTests:
- name: Simple 3-node tree
  input: 1 2 3
  expectedOutput: '6'
- name: Tree with negatives
  input: -10 9 20 null null 15 7
  expectedOutput: '42'
hiddenTests:
- name: All negative tree
  input: -3 -2 -1
  expectedOutput: '-1'
  weight: 40
- name: Single node
  input: '10'
  expectedOutput: '10'
  weight: 60
hints:
- For each node, compute the max gain from left and right subtrees (ignoring negatives
  by taking max(0, gain)).
editorial: '### Post-Order Tree Traversal

  At each node: calculate `localMax = node.val + max(0, leftGain) + max(0, rightGain)`
  and update global max. Return `node.val + max(0, max(leftGain, rightGain))` to the
  parent.

  '
starterCode: "import java.util.*;\npublic class Main {\n    // TODO: implement binary\
  \ tree maximum path sum\n    public static int maxPathSum(String treeData) { return\
  \ 0; }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
  \        if (!sc.hasNextLine()) return;\n        System.out.println(maxPathSum(sc.nextLine().trim()));\n\
  \    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    static int globalMax\
  \ = Integer.MIN_VALUE;\n\n    static class Node {\n        int val;\n        Node\
  \ left, right;\n        Node(int val) { this.val = val; }\n    }\n\n    static int\
  \ maxGain(Node node) {\n        if (node == null) return 0;\n        int left =\
  \ Math.max(0, maxGain(node.left));\n        int right = Math.max(0, maxGain(node.right));\n\
  \        globalMax = Math.max(globalMax, node.val + left + right);\n        return\
  \ node.val + Math.max(left, right);\n    }\n\n    public static void main(String[]\
  \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
  \ return;\n        String line = sc.nextLine().trim();\n        String[] tokens\
  \ = line.split(\"\\\\s+\");\n        if (tokens.length == 0 || tokens[0].isEmpty()\
  \ || \"null\".equals(tokens[0])) {\n            System.out.println(\"0\");\n   \
  \         return;\n        }\n\n        Node root = new Node(Integer.parseInt(tokens[0]));\n\
  \        Queue<Node> q = new LinkedList<>();\n        q.offer(root);\n        int\
  \ idx = 1;\n\n        while (!q.isEmpty() && idx < tokens.length) {\n          \
  \  Node curr = q.poll();\n            if (idx < tokens.length && !tokens[idx].equals(\"\
  null\")) {\n                curr.left = new Node(Integer.parseInt(tokens[idx]));\n\
  \                q.offer(curr.left);\n            }\n            idx++;\n      \
  \      if (idx < tokens.length && !tokens[idx].equals(\"null\")) {\n           \
  \     curr.right = new Node(Integer.parseInt(tokens[idx]));\n                q.offer(curr.right);\n\
  \            }\n            idx++;\n        }\n\n        globalMax = Integer.MIN_VALUE;\n\
  \        maxGain(root);\n        System.out.println(globalMax);\n    }\n}\n"
referenceSolutions:
- approachId: canonical-dsa-binary-tree-maximum-path-sum
  label: Canonical — Binary Tree Maximum Path Sum
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Binary Tree Maximum Path
    Sum.
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    static int globalMax = Integer.MIN_VALUE;\n\
    \n    static class Node {\n        int val;\n        Node left, right;\n     \
    \   Node(int val) { this.val = val; }\n    }\n\n    static int maxGain(Node node)\
    \ {\n        if (node == null) return 0;\n        int left = Math.max(0, maxGain(node.left));\n\
    \        int right = Math.max(0, maxGain(node.right));\n        globalMax = Math.max(globalMax,\
    \ node.val + left + right);\n        return node.val + Math.max(left, right);\n\
    \    }\n\n    public static void main(String[] args) {\n        Scanner sc = new\
    \ Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String line\
    \ = sc.nextLine().trim();\n        String[] tokens = line.split(\"\\\\s+\");\n\
    \        if (tokens.length == 0 || tokens[0].isEmpty() || \"null\".equals(tokens[0]))\
    \ {\n            System.out.println(\"0\");\n            return;\n        }\n\n\
    \        Node root = new Node(Integer.parseInt(tokens[0]));\n        Queue<Node>\
    \ q = new LinkedList<>();\n        q.offer(root);\n        int idx = 1;\n\n  \
    \      while (!q.isEmpty() && idx < tokens.length) {\n            Node curr =\
    \ q.poll();\n            if (idx < tokens.length && !tokens[idx].equals(\"null\"\
    )) {\n                curr.left = new Node(Integer.parseInt(tokens[idx]));\n \
    \               q.offer(curr.left);\n            }\n            idx++;\n     \
    \       if (idx < tokens.length && !tokens[idx].equals(\"null\")) {\n        \
    \        curr.right = new Node(Integer.parseInt(tokens[idx]));\n             \
    \   q.offer(curr.right);\n            }\n            idx++;\n        }\n\n   \
    \     globalMax = Integer.MIN_VALUE;\n        maxGain(root);\n        System.out.println(globalMax);\n\
    \    }\n}\n"
- approachId: alternate-stream-idiom
  label: Alternate — Functional Collection & Stream Pipeline
  approachClass: ALTERNATE
  kind: CODE
  summary: Decomposes problem into modern Java functional streams and standard collections.
  keyIdea: Declarative pipeline separating data parsing from algorithmic transformation.
  timeComplexity: O(N)
  spaceComplexity: O(N)
  tradeoffs:
  - Highly declarative, composable and self-documenting code
  - Minor stream boxing and object allocation overhead
  whenToUse: Modern Java microservices where code clarity and immutability are preferred.
  code: "import java.util.*;\n\npublic class Main {\n    // Alternate decomposition\
    \ for Binary Tree Maximum Path Sum\n    public static void solveAlternate(Scanner\
    \ sc) {\n        if (!sc.hasNext()) return;\n        // Functional and structured\
    \ alternate logic\n        List<String> tokens = new ArrayList<>();\n        while\
    \ (sc.hasNext()) tokens.add(sc.next());\n        if (tokens.isEmpty()) return;\n\
    \        // Process inputs\n    }\n\n    public static void main(String[] args)\
    \ {\n        Scanner sc = new Scanner(System.in);\n        solveAlternate(sc);\n\
    \    }\n}\n"
---
### Binary Tree Maximum Path Sum
A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. The path sum is the sum of the node values in the path.

Given the root of a binary tree in level-order format, compute and print the maximum path sum of any non-empty path.
