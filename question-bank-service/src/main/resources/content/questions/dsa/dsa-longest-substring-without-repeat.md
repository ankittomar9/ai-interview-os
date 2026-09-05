---
slug: dsa-longest-substring-without-repeat
title: Longest Non-Repeating Substring
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [strings, sliding-window, hash-table]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/sliding-window-substring
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: "abcabcbb"
    expectedOutput: "3"
  - name: "All same characters"
    input: "bbbbb"
    expectedOutput: "1"
hiddenTests:
  - name: "Subsequence with middle unique"
    input: "pwwkew"
    expectedOutput: "3"
    weight: 30
  - name: "Empty / single char"
    input: "a"
    expectedOutput: "1"
    weight: 30
  - name: "Distinct alphanumeric"
    input: "abcdef"
    expectedOutput: "6"
    weight: 40
hints:
  - "Maintain a sliding window [left, right] and a Map storing the last seen index of each character."
editorial: |
  ### Sliding Window with Index Lookup
  Whenever a duplicate character is encountered inside the current window, move `left` to `lastIndex + 1`.
starterCode: |
  import java.util.*;
  public class Main {
      // TODO: implement length of longest substring without repeating characters
      public static int lengthOfLongestSubstring(String s) { return 0; }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) { System.out.println("0"); return; }
          System.out.println(lengthOfLongestSubstring(sc.next()));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) {
              System.out.println("0");
              return;
          }
          String s = sc.next();
          Map<Character, Integer> lastSeen = new HashMap<>();
          int maxLen = 0, left = 0;

          for (int right = 0; right < s.length(); right++) {
              char c = s.charAt(right);
              if (lastSeen.containsKey(c)) {
                  left = Math.max(left, lastSeen.get(c) + 1);
              }
              lastSeen.put(c, right);
              maxLen = Math.max(maxLen, right - left + 1);
          }
          System.out.println(maxLen);
      }
  }
---
### Longest Non-Repeating Substring
Given a string `s`, find the length of the longest substring without duplicate characters.
