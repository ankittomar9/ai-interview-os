---
slug: dsa-trie-prefix-search
title: Autocomplete Trie Prefix Dictionary
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags: [trie, strings, prefix-tree, design]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/trie-prefix
status: PUBLISHED
sampleTests:
  - name: "Sample trie sequence"
    input: "5\ninsert apple\nsearch apple\nsearch app\nstartsWith app\ninsert app"
    expectedOutput: "true\nfalse\ntrue"
hiddenTests:
  - name: "Prefix not found"
    input: "3\ninsert banana\nstartsWith ban\nsearch band"
    expectedOutput: "true\nfalse"
    weight: 50
  - name: "Empty search"
    input: "2\ninsert code\nstartsWith cod"
    expectedOutput: "true"
    weight: 50
hints:
  - "Each TrieNode has children[26] and a boolean isEndOfWord."
editorial: |
  ### Trie Prefix Tree
  Insert traverses character by character, creating child nodes. Prefix match checks if the path exists; search checks path existence AND `isEndOfWord`.
starterCode: |
  import java.util.*;
  public class Main {
      static class Trie {
          void insert(String word) {} // TODO: implement
          boolean search(String word) { return false; } // TODO: implement
          boolean startsWith(String prefix) { return false; } // TODO: implement
      }
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int q = sc.nextInt();
          Trie trie = new Trie();
          while (q-- > 0 && sc.hasNext()) {
              String op = sc.next(), word = sc.next();
              if ("insert".equalsIgnoreCase(op)) trie.insert(word);
              else if ("search".equalsIgnoreCase(op)) System.out.println(trie.search(word));
              else if ("startsWith".equalsIgnoreCase(op)) System.out.println(trie.startsWith(word));
          }
      }
  }
solutionCode: |
  import java.util.*;

  public class Main {
      static class TrieNode {
          TrieNode[] children = new TrieNode[26];
          boolean isEnd;
      }

      static class Trie {
          TrieNode root = new TrieNode();

          void insert(String word) {
              TrieNode node = root;
              for (char c : word.toCharArray()) {
                  int idx = c - 'a';
                  if (node.children[idx] == null) node.children[idx] = new TrieNode();
                  node = node.children[idx];
              }
              node.isEnd = true;
          }

          boolean search(String word) {
              TrieNode node = root;
              for (char c : word.toCharArray()) {
                  int idx = c - 'a';
                  if (node.children[idx] == null) return false;
                  node = node.children[idx];
              }
              return node.isEnd;
          }

          boolean startsWith(String prefix) {
              TrieNode node = root;
              for (char c : prefix.toCharArray()) {
                  int idx = c - 'a';
                  if (node.children[idx] == null) return false;
                  node = node.children[idx];
              }
              return true;
          }
      }

      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          if (!sc.hasNextInt()) return;
          int q = sc.nextInt();
          Trie trie = new Trie();

          while (q-- > 0 && sc.hasNext()) {
              String op = sc.next();
              String word = sc.next();
              if ("insert".equalsIgnoreCase(op)) {
                  trie.insert(word);
              } else if ("search".equalsIgnoreCase(op)) {
                  System.out.println(trie.search(word));
              } else if ("startsWith".equalsIgnoreCase(op)) {
                  System.out.println(trie.startsWith(word));
              }
          }
      }
  }
---
### Autocomplete Trie Prefix Dictionary
Implement a `Trie` (Prefix Tree) supporting `insert`, `search`, and `startsWith` queries.
