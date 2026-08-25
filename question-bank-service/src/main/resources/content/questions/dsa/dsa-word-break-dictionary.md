---
slug: dsa-word-break-dictionary
title: Dictionary Word Segmentation
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [dynamic-programming, strings, hash-set]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/dp-word-break
status: PUBLISHED
sampleTests:
  - name: "Valid single breakdown"
    input: "leetcode\n2 leet code"
    expectedOutput: "true"
  - name: "Repeated words"
    input: "applepenapple\n2 apple pen"
    expectedOutput: "true"
hiddenTests:
  - name: "Invalid segment"
    input: "catsandog\n5 cats dog sand and cat"
    expectedOutput: "false"
    weight: 40
  - name: "Single letter dictionary"
    input: "aaaaaaa\n2 a aa"
    expectedOutput: "true"
    weight: 60
hints:
  - "Let dp[i] represent whether s[0..i] can be segmented into valid dictionary words."
editorial: |
  ### Dynamic Programming Prefix Check
  `dp[i] = true` if there is a `j < i` such that `dp[j] == true` and `s.substring(j, i)` is in the word set.
solutionCode: |
  import java.util.*;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) return;
          String s = sc.next();
          int dictSize = sc.nextInt();
          Set<String> dict = new HashSet<>();
          for (int i = 0; i < dictSize; i++) dict.add(sc.next());

          boolean[] dp = new boolean[s.length() + 1];
          dp[0] = true;

          for (int i = 1; i <= s.length(); i++) {
              for (int j = 0; j < i; j++) {
                  if (dp[j] && dict.contains(s.substring(j, i))) {
                      dp[i] = true;
                      break;
                  }
              }
          }
          System.out.println(dp[s.length()]);
      }
  }
---
### Dictionary Word Segmentation
Given a string `s` and a dictionary of words `dict`, determine if `s` can be segmented into a space-separated sequence of one or more dictionary words.
