---
slug: dsa-remove-loop-in-linked-list
title: "Remove Loop in Linked List"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [linked-list, two-pointers]
est_minutes: 25
tags: [linked-list, two-pointers, floyd-cycle-detection, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/remove-loop-in-linked-list
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      3 2
      1 3 4
    expectedOutput: |
      1 3 4
    description: "Loop at pos 2 removed, linear list printed"
  - name: "Sample 2"
    input: |
      4 0
      1 8 3 4
    expectedOutput: |
      1 8 3 4
    description: "No loop present, list remains linear"
hiddenTests:
  - name: "Self Loop at Tail"
    input: |
      1 1
      42
    expectedOutput: |
      42
    weight: 50
  - name: "Full Circular Loop"
    input: |
      5 1
      10 20 30 40 50
    expectedOutput: |
      10 20 30 40 50
    weight: 50
hints:
  - "Use Floyd's Cycle-Finding Algorithm (slow and fast pointers) to detect the meeting point."
  - "Once a meeting point is found, reset slow to head while keeping fast at meeting point."
  - "Advance both one step at a time to find the start of the cycle, and locate the predecessor node to set its next = null."
constraints:
  - "1 <= N <= 10^4"
  - "1 <= value <= 10^5"
  - "0 <= pos <= N"
coaching:
  presentationTips:
    - "Walk through the Floyd cycle detection math (distance 2k - k = multiple of loop length)."
    - "Watch out for the edge case where the loop starts at the head node itself."
  approachHint: "Floyd's algorithm + loop starting node predecessor unlinking."
editorial: |
  ### Remove Loop in Linked List
  1. Initialize `slow = head`, `fast = head`.
  2. Move `slow = slow.next` and `fast = fast.next.next`. If `fast == null || fast.next == null`, no loop exists.
  3. When `slow == fast`:
     - If `slow == head`: find the last node in the cycle by moving until `fast.next == slow`, then set `fast.next = null`.
     - Otherwise, reset `slow = head`. Move both `slow = slow.next` and `fast = fast.next` until `slow.next == fast.next`. Set `fast.next = null`.
  - **Time Complexity:** O(N)
  - **Space Complexity:** O(1)
starterCode: |
  import java.util.*;

  public class Main {
      static class Node {
          int data;
          Node next;
          Node(int d) { data = d; }
      }

      // TODO: implement loop removal in linked list
      public static void removeLoop(Node head) {
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), pos = sc.nextInt();
          if (n <= 0) return;

          Node head = new Node(sc.nextInt());
          Node tail = head;
          Node loopNode = (pos == 1) ? head : null;

          for (int i = 2; i <= n; i++) {
              tail.next = new Node(sc.nextInt());
              tail = tail.next;
              if (i == pos) loopNode = tail;
          }
          if (pos > 0 && loopNode != null) tail.next = loopNode;

          removeLoop(head);

          List<String> out = new ArrayList<>();
          Node curr = head;
          int count = 0;
          while (curr != null && count <= n + 1) {
              out.add(String.valueOf(curr.data));
              curr = curr.next;
              count++;
          }
          System.out.println(String.join(" ", out));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      static class Node {
          int data;
          Node next;
          Node(int d) { data = d; }
      }

      public static void removeLoop(Node head) {
          if (head == null || head.next == null) return;

          Node slow = head;
          Node fast = head;

          boolean hasLoop = false;
          while (fast != null && fast.next != null) {
              slow = slow.next;
              fast = fast.next.next;
              if (slow == fast) {
                  hasLoop = true;
                  break;
              }
          }

          if (!hasLoop) return;

          // Special case: loop starts at head
          if (slow == head) {
              while (fast.next != head) {
                  fast = fast.next;
              }
              fast.next = null;
              return;
          }

          slow = head;
          while (slow.next != fast.next) {
              slow = slow.next;
              fast = fast.next;
          }
          fast.next = null;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt();
          int pos = sc.nextInt();
          if (n <= 0) return;

          Node head = new Node(sc.nextInt());
          Node tail = head;
          Node loopNode = (pos == 1) ? head : null;

          for (int i = 2; i <= n; i++) {
              tail.next = new Node(sc.nextInt());
              tail = tail.next;
              if (i == pos) loopNode = tail;
          }
          if (pos > 0 && loopNode != null) {
              tail.next = loopNode;
          }

          removeLoop(head);

          List<String> out = new ArrayList<>();
          Node curr = head;
          int count = 0;
          while (curr != null && count <= n + 1) {
              out.add(String.valueOf(curr.data));
              curr = curr.next;
              count++;
          }
          System.out.println(String.join(" ", out));
      }
  }
---

### Remove Loop in Linked List

Given the head of a linked list that may contain a loop, detect and remove the loop if it exists.

A loop is present if the `next` pointer of the last node points back to some previous node in the linked list. If a loop is found, remove it by setting the `next` pointer of the last node to `null`.

#### Input Format:
- Line 1: Two integers `N` (number of nodes) and `pos` (1-based position of the node the last node connects to, or 0 if no loop).
- Line 2: `N` space-separated integers representing the node values.

#### Output Format:
- Print the space-separated values of the unlooped linked list.

#### Constraints:
- `1 <= N <= 10^4`
- `0 <= pos <= N`
- `1 <= value <= 10^5`
