---
slug: dsa-word-boggle
title: "Word Boggle Board Search"
track: ALGORITHMS_DATA_STRUCTURES
difficulty: HARD
topics: [trie, matrix, recursion]
est_minutes: 35
tags: [trie, backtracking, matrix, dfs, sde-sheet]
buildProfile: judge0
source: inspired-by:gkgaurav31/word-boggle
status: PUBLISHED
sampleTests:
  - name: "Sample 1"
    input: |
      4
      GEEKS FOR QUIZ GO
      3 3
      G I Z
      U E K
      Q S E
    expectedOutput: |
      GEEKS QUIZ
    description: "Find words present on 3x3 board"
  - name: "Sample 2"
    input: |
      1
      CAT
      2 2
      A B
      C D
    expectedOutput: |
      -1
    description: "Word CAT not constructible"
hiddenTests:
  - name: "Adjacent 2-Letter Words"
    input: |
      2
      AB BC
      2 2
      A B
      C D
    expectedOutput: |
      AB BC
    weight: 50
  - name: "Uniform Board"
    input: |
      1
      AAA
      2 2
      A A
      A A
    expectedOutput: |
      AAA
    weight: 50
hints:
  - "Use a Trie to store the dictionary words for fast prefix lookups."
  - "From each cell in the board, perform DFS in 8 directions, pruning paths that are not valid Trie prefixes."
  - "Collect distinct found words and output them in alphabetical order."
constraints:
  - "1 <= W <= 50"
  - "1 <= R, C <= 10"
  - "Dictionary words and board characters are uppercase English letters."
coaching:
  presentationTips:
    - "Explain why a Trie combined with backtracking is drastically faster than searching each word independently."
    - "Detail the backtracking visited cell management."
  approachHint: "Trie prefix tree + 8-directional backtracking DFS."
editorial: |
  ### Word Boggle Board Search
  1. Insert all dictionary words into a Trie.
  2. From each cell `(i, j)`, initiate a backtracking DFS along 8 adjacent directions.
  3. At each step, follow the Trie node matching `board[i][j]`. If no matching child exists, backtrack immediately.
  4. When reaching a Trie node marked as an end of word, add the word to a `TreeSet` (to ensure uniqueness and sorted order).
  5. If the result set is empty, print `-1`. Otherwise print the words separated by spaces.
  - **Time Complexity:** O(R * C * 8^L) where L is the maximum word length.
  - **Space Complexity:** O(W * L + R * C) for Trie and recursion stack.
starterCode: |
  import java.util.*;

  public class Main {
      // TODO: implement word boggle search
      public static List<String> wordBoggle(char[][] board, String[] dictionary) {
          return new ArrayList<>();
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int w = sc.nextInt();
          String[] dictionary = new String[w];
          for (int i = 0; i < w; i++) dictionary[i] = sc.next();
          int r = sc.nextInt(), c = sc.nextInt();
          char[][] board = new char[r][c];
          for (int i = 0; i < r; i++)
              for (int j = 0; j < c; j++)
                  board[i][j] = sc.next().charAt(0);

          List<String> found = wordBoggle(board, dictionary);
          if (found.isEmpty()) {
              System.out.println("-1");
          } else {
              System.out.println(String.join(" ", found));
          }
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      static class TrieNode {
          Map<Character, TrieNode> children = new HashMap<>();
          String word = null;
      }

      private static void insert(TrieNode root, String word) {
          TrieNode curr = root;
          for (char ch : word.toCharArray()) {
              curr.children.putIfAbsent(ch, new TrieNode());
              curr = curr.children.get(ch);
          }
          curr.word = word;
      }

      private static void dfs(int r, int c, char[][] board, boolean[][] visited, TrieNode node, Set<String> result) {
          char ch = board[r][c];
          if (!node.children.containsKey(ch)) return;

          TrieNode next = node.children.get(ch);
          if (next.word != null) {
              result.add(next.word);
          }

          visited[r][c] = true;
          int[] dr = {-1, -1, -1, 0, 0, 1, 1, 1};
          int[] dc = {-1, 0, 1, -1, 1, -1, 0, 1};

          for (int d = 0; d < 8; d++) {
              int nr = r + dr[d];
              int nc = c + dc[d];
              if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length && !visited[nr][nc]) {
                  dfs(nr, nc, board, visited, next, result);
              }
          }

          visited[r][c] = false;
      }

      public static List<String> wordBoggle(char[][] board, String[] dictionary) {
          TrieNode root = new TrieNode();
          for (String w : dictionary) insert(root, w);

          int r = board.length;
          int c = board[0].length;
          boolean[][] visited = new boolean[r][c];
          Set<String> result = new TreeSet<>();

          for (int i = 0; i < r; i++) {
              for (int j = 0; j < c; j++) {
                  dfs(i, j, board, visited, root, result);
              }
          }

          return new ArrayList<>(result);
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int w = sc.nextInt();
          String[] dictionary = new String[w];
          for (int i = 0; i < w; i++) dictionary[i] = sc.next();
          int r = sc.nextInt(), c = sc.nextInt();
          char[][] board = new char[r][c];
          for (int i = 0; i < r; i++)
              for (int j = 0; j < c; j++)
                  board[i][j] = sc.next().charAt(0);

          List<String> found = wordBoggle(board, dictionary);
          if (found.isEmpty()) {
              System.out.println("-1");
          } else {
              System.out.println(String.join(" ", found));
          }
      }
  }
---

### Word Boggle Board Search

Given a dictionary of distinct words and an `R x C` board containing uppercase English characters. Find all words in the dictionary that can be formed by a sequence of adjacent characters on the board. You can move to any of 8 adjacent characters (horizontal, vertical, or diagonal), but a cell cannot be used more than once in the same word.

Print all found words in alphabetical order separated by space. If no word can be formed, print `-1`.

#### Input Format:
- Line 1: An integer `W` representing the number of words in the dictionary.
- Line 2: `W` space-separated words.
- Line 3: Two integers `R` and `C` representing the board dimensions.
- Next `R` lines: `C` space-separated uppercase characters.

#### Output Format:
- Print the found words in lexicographical order separated by spaces, or `-1` if none found.

#### Constraints:
- `1 <= W <= 50`
- `1 <= R, C <= 10`
