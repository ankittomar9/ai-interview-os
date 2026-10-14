---
slug: dsa-allocate-minimum-number-of-pages
title: "Allocate Minimum Number of Pages"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [binary-search, arrays]
est_minutes: 30
tags: [binary-search, arrays, greedy, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/allocate-minimum-number-of-pages
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      4 2
      12 34 67 90
    expectedOutput: |
      113
    description: "Student 1: [12, 34, 67] (113 pages), Student 2: [90] (90 pages)"
  - name: "Sample 2"
    input: |
      3 4
      15 17 20
    expectedOutput: |
      -1
    description: "More students than books (M > N) is impossible (-1)"
hiddenTests:
  - name: "Close Split"
    input: |
      5 4
      10 20 30 40 50
    expectedOutput: |
      50
    weight: 50
  - name: "Single Student Single Book"
    input: |
      1 1
      100
    expectedOutput: |
      100
    weight: 50
hints:
  - "Use Binary Search on the answer."
  - "Lower bound: max(pages) (a student must read at least the largest single book)."
  - "Upper bound: sum(pages) (one student reads all books)."
  - "A mid value is feasible if we can allocate contiguous books to <= M students without any student exceeding mid pages."
constraints:
  - "1 <= N <= 10^5"
  - "1 <= M <= 10^5"
  - "1 <= A[i] <= 10^5"
coaching:
  presentationTips:
    - "Formulate the monotonic predicate: if allocation with max capacity C is possible, all C' > C are also possible."
    - "Handle edge case M > N up front by returning -1."
  approachHint: "Binary Search on Answer range [max(arr), sum(arr)]."
editorial: |
  ### Allocate Minimum Number of Pages
  1. If `M > N`, return `-1`.
  2. Binary search on the answer space:
     - `low = max(A)`, `high = sum(A)`.
  3. For each `mid`:
     - Check if books can be allocated to `<= M` students with each student getting `<= mid` pages.
     - If feasible, `ans = mid`, try smaller `high = mid - 1`.
     - Else, try larger `low = mid + 1`.
  - **Time Complexity:** O(N * log(sum(A)))
  - **Space Complexity:** O(1)
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement allocate minimum number of pages
      public static long findPages(int[] a, int n, int m) {
          return -1;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), m = sc.nextInt();
          int[] a = new int[n];
          for (int i = 0; i < n; i++) a[i] = sc.nextInt();
          System.out.println(findPages(a, n, m));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      private static boolean isPossible(int[] a, int n, int m, long maxPages) {
          int students = 1;
          long currentPages = 0;

          for (int pages : a) {
              if (pages > maxPages) return false;
              if (currentPages + pages > maxPages) {
                  students++;
                  currentPages = pages;
                  if (students > m) return false;
              } else {
                  currentPages += pages;
              }
          }
          return true;
      }

      public static long findPages(int[] a, int n, int m) {
          if (m > n) return -1;

          long low = 0;
          long high = 0;
          for (int pages : a) {
              low = Math.max(low, pages);
              high += pages;
          }

          long ans = high;
          while (low <= high) {
              long mid = low + (high - low) / 2;
              if (isPossible(a, n, m, mid)) {
                  ans = mid;
                  high = mid - 1;
              } else {
                  low = mid + 1;
              }
          }
          return ans;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int n = sc.nextInt(), m = sc.nextInt();
          int[] a = new int[n];
          for (int i = 0; i < n; i++) a[i] = sc.nextInt();
          System.out.println(findPages(a, n, m));
      }
  }
---

### Allocate Minimum Number of Pages

You have `N` books, each with `A[i]` number of pages. `M` students need to be allocated contiguous books, with each student getting at least one book.

Out of all possible contiguous allocations, find the allocation where the maximum number of pages assigned to any student is minimized. If it is impossible to allocate books to all students, return `-1`.

#### Input Format:
- Line 1: Two integers `N` (number of books) and `M` (number of students).
- Line 2: `N` space-separated integers representing the number of pages in each book.

#### Output Format:
- Print a single integer representing the minimum possible value of the maximum pages allocated, or `-1` if allocation is impossible.

#### Constraints:
- `1 <= N <= 10^5`
- `1 <= M <= 10^5`
- `1 <= A[i] <= 10^5`
