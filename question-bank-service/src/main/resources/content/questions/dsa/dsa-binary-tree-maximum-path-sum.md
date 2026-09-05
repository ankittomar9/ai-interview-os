---
slug: dsa-binary-tree-maximum-path-sum
title: Binary Tree Maximum Path Sum
track: ALGORITHMS_DATA_STRUCTURES
difficulty: STAFF
tags: [binary-tree, dfs, recursion, dynamic-programming]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/tree-path-sum
status: PUBLISHED
sampleTests:
  - name: "Simple 3-node tree"
    input: "1 2 3"
    expectedOutput: "6"
  - name: "Tree with negatives"
    input: "-10 9 20 null null 15 7"
    expectedOutput: "42"
hiddenTests:
  - name: "All negative tree"
    input: "-3 -2 -1"
    expectedOutput: "-1"
    weight: 40
  - name: "Single node"
    input: "10"
    expectedOutput: "10"
    weight: 60
hints:
  - "For each node, compute the max gain from left and right subtrees (ignoring negatives by taking max(0, gain))."
editorial: |
  ### Post-Order Tree Traversal
  At each node: calculate `localMax = node.val + max(0, leftGain) + max(0, rightGain)` and update global max. Return `node.val + max(0, max(leftGain, rightGain))` to the parent.
starterCode: |
  import java.util.*;
  public class Main {
      // TODO: implement binary tree maximum path sum
      public static int maxPathSum(String treeData) { return 0; }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextLine()) return;
          System.out.println(maxPathSum(sc.nextLine().trim()));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      static int globalMax = Integer.MIN_VALUE;

      static class Node {
          int val;
          Node left, right;
          Node(int val) { this.val = val; }
      }

      static int maxGain(Node node) {
          if (node == null) return 0;
          int left = Math.max(0, maxGain(node.left));
          int right = Math.max(0, maxGain(node.right));
          globalMax = Math.max(globalMax, node.val + left + right);
          return node.val + Math.max(left, right);
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) return;
          String line = sc.nextLine().trim();
          String[] tokens = line.split("\\s+");
          if (tokens.length == 0 || tokens[0].isEmpty() || "null".equals(tokens[0])) {
              System.out.println("0");
              return;
          }

          Node root = new Node(Integer.parseInt(tokens[0]));
          Queue<Node> q = new LinkedList<>();
          q.offer(root);
          int idx = 1;

          while (!q.isEmpty() && idx < tokens.length) {
              Node curr = q.poll();
              if (idx < tokens.length && !tokens[idx].equals("null")) {
                  curr.left = new Node(Integer.parseInt(tokens[idx]));
                  q.offer(curr.left);
              }
              idx++;
              if (idx < tokens.length && !tokens[idx].equals("null")) {
                  curr.right = new Node(Integer.parseInt(tokens[idx]));
                  q.offer(curr.right);
              }
              idx++;
          }

          globalMax = Integer.MIN_VALUE;
          maxGain(root);
          System.out.println(globalMax);
      }
  }
---
### Binary Tree Maximum Path Sum
A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. The path sum is the sum of the node values in the path.

Given the root of a binary tree in level-order format, compute and print the maximum path sum of any non-empty path.
