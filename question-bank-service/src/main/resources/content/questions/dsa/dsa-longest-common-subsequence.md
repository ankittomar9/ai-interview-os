---
slug: dsa-longest-common-subsequence
title: "Longest Common Subsequence"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [dp, strings]
est_minutes: 25
tags: [dp, strings, lcs, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/longest-common-subsequence
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      ABCDGH
      AEDFHR
    expectedOutput: |
      3
    description: "LCS is 'ADH' with length 3"
  - name: "Sample 2"
    input: |
      ABC
      AC
    expectedOutput: |
      2
    description: "LCS is 'AC' with length 2"
hiddenTests:
  - name: "Interleaved Match"
    input: |
      AGGTAB
      GXTXAYB
    expectedOutput: |
      4
    weight: 50
  - name: "Completely Disjoint"
    input: |
      ABC
      DEF
    expectedOutput: |
      0
    weight: 50
hints:
  - "Use a 2D DP table where dp[i][j] stores the LCS length of prefixes s1[0..i-1] and s2[0..j-1]."
  - "If s1[i-1] == s2[j-1], dp[i][j] = 1 + dp[i-1][j-1]. Otherwise, dp[i][j] = max(dp[i-1][j], dp[i][j-1])."
constraints:
  - "1 <= |S1|, |S2| <= 1000"
  - "S1 and S2 contain uppercase English alphabets."
coaching:
  presentationTips:
    - "Explain the optimal substructure and overlapping subproblems."
    - "Mention space optimization to O(min(m, n)) using two rolling rows."
  approachHint: "2D Dynamic Programming on prefixes."
editorial: |
  ### Longest Common Subsequence
  Maintain a 2D DP array `dp[n+1][m+1]` where `dp[i][j]` is the LCS length of `S1[0..i-1]` and `S2[0..j-1]`.
  - If `S1[i-1] == S2[j-1]`: `dp[i][j] = 1 + dp[i-1][j-1]`
  - Else: `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`
  - **Time Complexity:** O(N * M)
  - **Space Complexity:** O(N * M) (or O(min(N, M)) with space optimization).
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement longest common subsequence
      public static int lcs(String s1, String s2) {
          return 0;
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) return;
          String s1 = sc.next();
          String s2 = sc.next();
          System.out.println(lcs(s1, s2));
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      public static int lcs(String s1, String s2) {
          int n = s1.length();
          int m = s2.length();
          int[][] dp = new int[n + 1][m + 1];

          for (int i = 1; i <= n; i++) {
              for (int j = 1; j <= m; j++) {
                  if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                      dp[i][j] = 1 + dp[i - 1][j - 1];
                  } else {
                      dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                  }
              }
          }
          return dp[n][m];
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNext()) return;
          String s1 = sc.next();
          String s2 = sc.next();
          System.out.println(lcs(s1, s2));
      }
  }
---

### Longest Common Subsequence

Given two strings `S1` and `S2`, find the length of their longest common subsequence (LCS). A subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.

#### Input Format:
- Line 1: A string `S1`.
- Line 2: A string `S2`.

#### Output Format:
- Print a single integer representing the length of the longest common subsequence.

#### Constraints:
- `1 <= |S1|, |S2| <= 1000`
- `S1` and `S2` contain uppercase English alphabets.
