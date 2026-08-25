---
slug: dsa-lowest-common-ancestor-bst
title: Lowest Common Ancestor in Binary Search Tree
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [bst, trees, recursion, divide-and-conquer]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/bst-lca
status: PUBLISHED
sampleTests:
  - name: "Sample BST LCA"
    input: "6 2 8 0 4 7 9 null null 3 5\n2 8"
    expectedOutput: "6"
  - name: "Subtree LCA"
    input: "6 2 8 0 4 7 9 null null 3 5\n2 4"
    expectedOutput: "2"
hiddenTests:
  - name: "Direct parent-child"
    input: "2 1 3\n1 3"
    expectedOutput: "2"
    weight: 50
  - name: "Deep leaves LCA"
    input: "6 2 8 0 4 7 9 null null 3 5\n3 5"
    expectedOutput: "4"
    weight: 50
hints:
  - "Take advantage of BST property: if both values are smaller than current node, traverse left; if both greater, traverse right; otherwise current node is the split LCA."
editorial: |
  ### BST Value Navigation
  Starting from root: if `p < root.val && q < root.val` walk left. If `p > root.val && q > root.val` walk right. Otherwise, the current node is the LCA.
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) return;
          String treeLine = sc.nextLine().trim();
          int p = sc.nextInt();
          int q = sc.nextInt();

          String[] tokens = treeLine.split("\\s+");
          int rootVal = Integer.parseInt(tokens[0]);

          // Simple BST traversal logic
          int min = Math.min(p, q);
          int max = Math.max(p, q);

          // Find LCA using values
          int curr = rootVal;
          // In standard level-order or simulation:
          for (String t : tokens) {
              if (t.equals("null")) continue;
              int val = Integer.parseInt(t);
              if (val >= min && val <= max) {
                  // Candidate split point
                  System.out.println(val);
                  return;
              }
          }
          System.out.println(rootVal);
      }
  }
---
### Lowest Common Ancestor in Binary Search Tree
Given a Binary Search Tree (BST) and two node values `p` and `q`, find the Lowest Common Ancestor (LCA) node value.
