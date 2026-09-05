---
slug: dsa-valid-anagram-frequency
title: Anagram Character Frequency Matcher
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags: [strings, hash-table, frequency-array]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/strings-anagram
status: PUBLISHED
sampleTests:
  - name: "Valid Anagram"
    input: "anagram\nnagaram"
    expectedOutput: "true"
  - name: "Invalid Anagram"
    input: "rat\ncar"
    expectedOutput: "false"
hiddenTests:
  - name: "Single characters match"
    input: "a\na"
    expectedOutput: "true"
    weight: 20
  - name: "Different lengths"
    input: "ab\na"
    expectedOutput: "false"
    weight: 30
  - name: "Identical longer strings"
    input: "listen\nsilent"
    expectedOutput: "true"
    weight: 50
hints:
  - "Use a fixed size frequency table of 26 integers for lowercase English letters."
coaching:
  presentationTips:
    - "Mention how Unicode/ASCII would affect your choice between a 26-int array vs HashMap."
editorial: |
  ### Anagram Verification
  Count frequency differences using a fixed `int[26]` buffer. Increment for string S, decrement for string T.
starterCode: |
  import java.util.*;
  public class Main {
      // TODO: implement valid anagram check
      public static boolean isAnagram(String s, String t) { return false; }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) return;
          System.out.println(isAnagram(sc.next(), sc.next()));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) return;
          String s = sc.next();
          String t = sc.next();

          if (s.length() != t.length()) {
              System.out.println("false");
              return;
          }

          int[] freq = new int[26];
          for (int i = 0; i < s.length(); i++) {
              freq[s.charAt(i) - 'a']++;
              freq[t.charAt(i) - 'a']--;
          }

          for (int count : freq) {
              if (count != 0) {
                  System.out.println("false");
                  return;
              }
          }
          System.out.println("true");
      }
  }
---
### Anagram Character Frequency Matcher
Given two lowercase strings `s` and `t`, determine whether `t` is an anagram of `s` (same characters with identical frequencies).

Print `true` if they are valid anagrams, otherwise `false`.
