---
slug: dsa-reverse-linked-list-k-group
title: Reverse Linked List in k-Groups
track: ALGORITHMS_DATA_STRUCTURES
difficulty: SENIOR
tags: [linked-list, recursion, two-pointers]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/k-group-reversal
status: PUBLISHED
sampleTests:
  - name: "Sample k=2"
    input: "5 2\n1 2 3 4 5"
    expectedOutput: "2 1 4 3 5"
  - name: "Sample k=3"
    input: "5 3\n1 2 3 4 5"
    expectedOutput: "3 2 1 4 5"
hiddenTests:
  - name: "k=1 no reversal"
    input: "4 1\n1 2 3 4"
    expectedOutput: "1 2 3 4"
    weight: 25
  - name: "Exact multiple k=2"
    input: "4 2\n10 20 30 40"
    expectedOutput: "20 10 40 30"
    weight: 25
  - name: "k equals N"
    input: "3 3\n7 8 9"
    expectedOutput: "9 8 7"
    weight: 50
hints:
  - "Count if there are at least k nodes remaining before reversing the sub-segment."
editorial: |
  ### K-Group Linked List Reversal
  Iterate in chunks of size k. Reverse pointers within each chunk and stitch to the previous and next group.
starterCode: |
  import java.util.*;
  public class Main {
      // TODO: implement reverse in k-group
      public static int[] reverseKGroup(int[] arr, int k) { return arr; }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), k = sc.nextInt(), arr[] = new int[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
          for (int v : reverseKGroup(arr, k)) System.out.print(v + " ");
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int k = sc.nextInt();
          int[] arr = new int[n];
          for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

          for (int i = 0; i + k <= n; i += k) {
              int left = i, right = i + k - 1;
              while (left < right) {
                  int tmp = arr[left];
                  arr[left] = arr[right];
                  arr[right] = tmp;
                  left++;
                  right--;
              }
          }

          StringBuilder sb = new StringBuilder();
          for (int i = 0; i < n; i++) {
              if (i > 0) sb.append(" ");
              sb.append(arr[i]);
          }
          System.out.println(sb.toString());
      }
  }
---
### Reverse Linked List in k-Groups
Given a sequence of `N` elements representing a singly linked list and an integer `k`, reverse the nodes of the list `k` at a time, and print the resulting sequence.

If the number of nodes is not a multiple of `k`, left-out nodes in the end should remain in their original order.
