---
slug: dsa-first-non-repeating-character-stream
title: "First Non-Repeating Character in a Stream"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [strings, stacks-queues]
est_minutes: 25
tags: [strings, queue, stream, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/first-non-repeating-character-stream
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      aabc
    expectedOutput: |
      a#bb
    description: "'a' -> a, 'aa' -> #, 'aab' -> b, 'aabc' -> b"
  - name: "Sample 2"
    input: |
      zz
    expectedOutput: |
      z#
    description: "'z' -> z, 'zz' -> #"
hiddenTests:
  - name: "Alternating Stream"
    input: |
      abadbc
    expectedOutput: |
      aabbdd
    weight: 50
  - name: "Single Character"
    input: |
      a
    expectedOutput: |
      a
    weight: 50
hints:
  - "Use a frequency array of size 26 and a Queue of characters."
  - "As each character arrives, increment frequency and enqueue it."
  - "While queue is not empty and queue head has frequency > 1, dequeue it."
  - "If queue is empty, output '#', otherwise output queue head."
constraints:
  - "1 <= |A| <= 10^5"
  - "A consists of lowercase English letters only."
coaching:
  presentationTips:
    - "Explain why a Queue ensures FIFO access to the earliest unique character."
    - "Detail the amortized O(1) cost per character because each character enters and leaves the queue at most once."
  approachHint: "Frequency array + Queue for order maintenance."
editorial: |
  ### First Non-Repeating Character in a Stream
  Maintain:
  - `freq[26]`: tracks character counts.
  - `queue`: stores characters in arrival order.
  For each character `ch`:
  1. Increment `freq[ch - 'a']` and offer `ch` to queue.
  2. While queue is not empty and `freq[queue.peek() - 'a'] > 1`, poll from queue.
  3. If queue is empty, append `'#'`; else append `queue.peek()`.
  - **Time Complexity:** O(N)
  - **Space Complexity:** O(26) = O(1) auxiliary space.
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement first non-repeating character in stream
      public static String firstNonRepeating(String a) {
          return "";
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) return;
          String a = sc.next();
          System.out.println(firstNonRepeating(a));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static String firstNonRepeating(String a) {
          int[] freq = new int[26];
          Queue<Character> q = new LinkedList<>();
          StringBuilder sb = new StringBuilder();

          for (int i = 0; i < a.length(); i++) {
              char ch = a.charAt(i);
              freq[ch - 'a']++;
              q.offer(ch);

              while (!q.isEmpty() && freq[q.peek() - 'a'] > 1) {
                  q.poll();
              }

              if (q.isEmpty()) {
                  sb.append('#');
              } else {
                  sb.append(q.peek());
              }
          }
          return sb.toString();
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) return;
          String a = sc.next();
          System.out.println(firstNonRepeating(a));
      }
  }
---

### First Non-Repeating Character in a Stream

Given an input stream `A` consisting only of lowercase English alphabets. While reading characters from the stream, output which character has appeared only once up to that point. If there are many characters that have appeared only once, output the one that was the first to appear. If no such character exists, output `#`.

#### Input Format:
- Line 1: A string `A` representing the incoming stream of characters.

#### Output Format:
- Print a string where the i-th character is the first non-repeating character after reading the first i characters of the stream.

#### Constraints:
- `1 <= |A| <= 10^5`
- `A` consists of lowercase English letters.
