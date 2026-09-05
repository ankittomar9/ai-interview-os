---
slug: dsa-merge-k-sorted-streams
title: Merge K Sorted Data Streams
track: ALGORITHMS_DATA_STRUCTURES
difficulty: SENIOR
tags: [heap, priority-queue, divide-and-conquer, streams]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/merge-k-sorted
status: PUBLISHED
sampleTests:
  - name: "Sample 3 lists"
    input: "3\n3 1 4 5\n3 1 3 4\n2 2 6"
    expectedOutput: "1 1 2 3 4 4 5 6"
  - name: "Sample 2 lists"
    input: "2\n2 1 10\n2 2 20"
    expectedOutput: "1 2 10 20"
hiddenTests:
  - name: "Single stream"
    input: "1\n3 5 10 15"
    expectedOutput: "5 10 15"
    weight: 25
  - name: "Lists with negative values"
    input: "2\n2 -5 0\n2 -10 10"
    expectedOutput: "-10 -5 0 10"
    weight: 75
hints:
  - "Use a Min-Heap of size K storing the head of each stream."
editorial: |
  ### Min-Heap K-Way Merge
  Push the first element of each stream into a Min-Heap. Repeatedly extract the minimum and push the next element from that stream. Time Complexity: O(N log K).
starterCode: |
  import java.util.*;
  public class Main {
      // TODO: implement merge k sorted lists
      public static List<Integer> mergeKLists(List<List<Integer>> lists) { return new ArrayList<>(); }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int k = sc.nextInt();
          List<List<Integer>> lists = new ArrayList<>();
          for (int i = 0; i < k; i++) {
              int len = sc.nextInt();
              List<Integer> list = new ArrayList<>(len);
              for (int j = 0; j < len; j++) list.add(sc.nextInt());
              lists.add(list);
          }
          for (int v : mergeKLists(lists)) System.out.print(v + " ");
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      static class Element implements Comparable<Element> {
          int val, listIdx, elemIdx;
          Element(int val, int listIdx, int elemIdx) {
              this.val = val;
              this.listIdx = listIdx;
              this.elemIdx = elemIdx;
          }
          public int compareTo(Element o) {
              return Integer.compare(this.val, o.val);
          }
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int k = sc.nextInt();
          List<int[]> lists = new ArrayList<>();
          PriorityQueue<Element> pq = new PriorityQueue<>();

          for (int i = 0; i < k; i++) {
              int size = sc.nextInt();
              int[] arr = new int[size];
              for (int j = 0; j < size; j++) arr[j] = sc.nextInt();
              lists.add(arr);
              if (size > 0) pq.offer(new Element(arr[0], i, 0));
          }

          StringBuilder sb = new StringBuilder();
          boolean first = true;
          while (!pq.isEmpty()) {
              Element curr = pq.poll();
              if (!first) sb.append(" ");
              sb.append(curr.val);
              first = false;

              if (curr.elemIdx + 1 < lists.get(curr.listIdx).length) {
                  int nextVal = lists.get(curr.listIdx)[curr.elemIdx + 1];
                  pq.offer(new Element(nextVal, curr.listIdx, curr.elemIdx + 1));
              }
          }
          System.out.println(sb.toString());
      }
  }
---
### Merge K Sorted Data Streams
You are given `K` sorted integer streams. Merge all the streams into one sorted output array and print the result.
