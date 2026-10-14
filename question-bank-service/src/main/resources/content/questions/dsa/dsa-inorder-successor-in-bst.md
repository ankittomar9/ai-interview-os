---
slug: dsa-inorder-successor-in-bst
title: "Inorder Successor in BST"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [trees]
est_minutes: 25
tags: [trees, bst, inorder-traversal, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/inorder-successor-in-bst
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      5 8
      20 8 22 4 12
    expectedOutput: |
      12
    description: "Successor of 8 is 12"
  - name: "Sample 2"
    input: |
      5 22
      20 8 22 4 12
    expectedOutput: |
      -1
    description: "22 is maximum, no successor exists (-1)"
hiddenTests:
  - name: "Root Successor"
    input: |
      3 10
      20 10 30
    expectedOutput: |
      20
    weight: 50
  - name: "Single Node Tree"
    input: |
      1 5
      5
    expectedOutput: |
      -1
    weight: 50
hints:
  - "Start from the root. If current.val <= target, successor must be in the right subtree."
  - "If current.val > target, current could be the successor; record it as candidate and search left subtree."
constraints:
  - "1 <= N <= 10^4"
  - "1 <= val <= 10^5"
  - "All node values are unique."
coaching:
  presentationTips:
    - "Contrast the O(H) BST search against full O(N) inorder traversal."
    - "Explain the two cases: target node has a right child vs does not have a right child."
  approachHint: "Binary Search Tree navigation in O(H) time."
editorial: |
  ### Inorder Successor in BST
  Navigate down the BST from the root:
  - If `root.val > target`: `root` is a potential successor. Save `successor = root.val` and move to `root.left`.
  - If `root.val <= target`: the successor must be larger, so move to `root.right`.
  When traversal finishes, return the saved `successor` or `-1` if none found.
  - **Time Complexity:** O(H) where H is BST height.
  - **Space Complexity:** O(1) auxiliary space.
starterCode: |
  import java.util.*;

  public class Main {
      static class TreeNode {
          int val;
          TreeNode left, right;
          TreeNode(int v) { val = v; }
      }

      // TODO: implement inorder successor in BST
      public static int inorderSuccessor(TreeNode root, int target) {
          return -1;
      }

      private static TreeNode insert(TreeNode root, int val) {
          if (root == null) return new TreeNode(val);
          if (val < root.val) root.left = insert(root.left, val);
          else root.right = insert(root.right, val);
          return root;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), target = sc.nextInt();
          TreeNode root = null;
          for (int i = 0; i < n; i++) root = insert(root, sc.nextInt());
          System.out.println(inorderSuccessor(root, target));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      static class TreeNode {
          int val;
          TreeNode left, right;
          TreeNode(int v) { val = v; }
      }

      public static int inorderSuccessor(TreeNode root, int target) {
          int successor = -1;
          TreeNode curr = root;

          while (curr != null) {
              if (curr.val > target) {
                  successor = curr.val;
                  curr = curr.left;
              } else {
                  curr = curr.right;
              }
          }
          return successor;
      }

      private static TreeNode insert(TreeNode root, int val) {
          if (root == null) return new TreeNode(val);
          if (val < root.val) root.left = insert(root.left, val);
          else root.right = insert(root.right, val);
          return root;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int target = sc.nextInt();
          TreeNode root = null;
          for (int i = 0; i < n; i++) {
              root = insert(root, sc.nextInt());
          }
          System.out.println(inorderSuccessor(root, target));
      }
  }
---

### Inorder Successor in BST

Given the root of a Binary Search Tree (BST) and a value `target`, return the in-order successor of that node in the BST. If the given target has no in-order successor in the tree, return `-1`.

The in-order successor of a node is the node with the smallest key strictly greater than `target`.

#### Input Format:
- Line 1: Two integers `N` (number of nodes) and `target`.
- Line 2: `N` space-separated integers inserted into the BST in order.

#### Output Format:
- Print a single integer representing the value of the inorder successor, or `-1` if no successor exists.

#### Constraints:
- `1 <= N <= 10^4`
- `1 <= val, target <= 10^5`
- All keys in the BST are unique.
