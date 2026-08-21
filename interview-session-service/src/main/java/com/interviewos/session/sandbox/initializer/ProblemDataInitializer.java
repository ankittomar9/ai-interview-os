package com.interviewos.session.sandbox.initializer;

import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProblemDataInitializer implements CommandLineRunner {

    private final ProblemRepository problemRepository;

    @Override
    public void run(String... args) {
        try {
            log.info("Synchronizing and seeding standard technical interview problems into MongoDB...");

            // 1. LRU Cache (Operations-based Standard I/O Contract)
            ProblemDocument lruCache = ProblemDocument.builder()
                    .problemSlug("lru-cache")
                    .title("LRU Cache Implementation")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("SENIOR")
                    .problemStatement("""
                            ### LRU Cache (Least Recently Used)
                            Implement an LRU Cache with standard I/O operations.
                            
                            ### Input Format
                            - Line 1: An integer `capacity` representing the maximum number of items in the cache.
                            - Following lines: Operations in the format `put <key> <value>` or `get <key>`.
                            
                            ### Output Format
                            For each `get <key>` command, print the value if found, or `-1` if not found (or evicted), one output per line.
                            
                            ### Example
                            Input:
                            2
                            put 1 1
                            put 2 2
                            get 1
                            put 3 3
                            get 2
                            put 4 4
                            get 1
                            get 3
                            get 4
                            
                            Output:
                            1
                            -1
                            -1
                            3
                            4
                            """)
                    .starterCode(Map.of(
                            "java", """
                                    import java.util.*;

                                    public class Main {
                                        // TODO: Implement your LRU Cache Doubly-Linked-List & Map data structures here

                                        public static void main(String[] args) {
                                            Scanner scanner = new Scanner(System.in);
                                            if (!scanner.hasNextInt()) return;

                                            int capacity = scanner.nextInt();
                                            // Initialize your cache with capacity

                                            while (scanner.hasNext()) {
                                                String op = scanner.next();
                                                if ("put".equalsIgnoreCase(op)) {
                                                    int key = scanner.nextInt();
                                                    int val = scanner.nextInt();
                                                    // TODO: put(key, val)
                                                } else if ("get".equalsIgnoreCase(op)) {
                                                    int key = scanner.nextInt();
                                                    // TODO: int val = get(key); System.out.println(val);
                                                    System.out.println(-1);
                                                }
                                            }
                                        }
                                    }
                                    """,
                            "python", """
                                      import sys

                                      def main():
                                          lines = sys.stdin.read().strip().splitlines()
                                          if not lines:
                                              return
                                          
                                          capacity = int(lines[0].strip())
                                          # Initialize your LRU cache

                                          for line in lines[1:]:
                                              parts = line.strip().split()
                                              if not parts:
                                                  continue
                                              if parts[0] == 'put':
                                                  k, v = int(parts[1]), int(parts[2])
                                                  # TODO: put(k, v)
                                              elif parts[0] == 'get':
                                                  k = int(parts[1])
                                                  # TODO: get(k)
                                                  print(-1)

                                      if __name__ == '__main__':
                                          main()
                                      """,
                            "javascript", """
                                          const fs = require('fs');

                                          function main() {
                                              const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
                                              if (input.length === 0 || !input[0]) return;

                                              const capacity = parseInt(input[0].trim(), 10);
                                              // Initialize your LRU Cache

                                              for (let i = 1; i < input.length; i++) {
                                                  const parts = input[i].trim().split(/\\s+/);
                                                  if (parts[0] === 'put') {
                                                      const k = parseInt(parts[1], 10);
                                                      const v = parseInt(parts[2], 10);
                                                      // TODO: put(k, v)
                                                  } else if (parts[0] === 'get') {
                                                      const k = parseInt(parts[1], 10);
                                                      // TODO: get(k)
                                                      console.log(-1);
                                                  }
                                              }
                                          }

                                          main();
                                          """
                    ))
                    .sampleTests(List.of(
                            new ProblemDocument.TestCase("Sample 1: Standard Capacity 2 Eviction", "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4", "1\n-1\n-1\n3\n4"),
                            new ProblemDocument.TestCase("Sample 2: Capacity 1 Single Item Eviction", "1\nput 1 10\nget 1\nput 2 20\nget 1\nget 2", "10\n-1\n20")
                    ))
                    .hiddenTests(List.of(
                            new ProblemDocument.HiddenTestCase("Hidden 1: Update Existing Key", "2\nget 2\nput 2 6\nget 1\nput 1 5\nput 1 2\nget 1\nget 2", "-1\n-1\n2\n6", 2),
                            new ProblemDocument.HiddenTestCase("Hidden 2: Capacity 3 Sequential Overwrite", "3\nput 1 1\nput 2 2\nput 3 3\nput 4 4\nget 4\nget 3\nget 2\nget 1", "4\n3\n2\n-1", 2)
                    ))
                    .limits(new ProblemDocument.ExecutionLimits(512, 2000))
                    .build();

            // 2. Reverse a String
            ProblemDocument reverseString = ProblemDocument.builder()
                    .problemSlug("reverse-a-string")
                    .title("Reverse a String")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("JUNIOR")
                    .problemStatement("Read a single line from standard input and print the reversed string to standard output.")
                    .starterCode(Map.of(
                            "java", """
                                    import java.util.Scanner;

                                    public class Main {
                                        public static void main(String[] args) {
                                            Scanner scanner = new Scanner(System.in);
                                            if (scanner.hasNextLine()) {
                                                String input = scanner.nextLine();
                                                // TODO: Reverse the string and print
                                                System.out.println(input);
                                            }
                                        }
                                    }
                                    """,
                            "python", """
                                      import sys

                                      def main():
                                          lines = sys.stdin.read().splitlines()
                                          if lines:
                                              input_str = lines[0]
                                              # TODO: Reverse string and print
                                              print(input_str)

                                      if __name__ == '__main__':
                                          main()
                                      """,
                            "javascript", """
                                          const fs = require('fs');

                                          function main() {
                                              const input = fs.readFileSync(0, 'utf-8').trim();
                                              // TODO: Reverse string and print
                                              console.log(input);
                                          }

                                          main();
                                          """
                    ))
                    .sampleTests(List.of(
                            new ProblemDocument.TestCase("Sample 1: Basic Inversion", "Hello, World!", "!dlroW ,olleH"),
                            new ProblemDocument.TestCase("Sample 2: Palindrome", "racecar", "racecar")
                    ))
                    .hiddenTests(List.of(
                            new ProblemDocument.HiddenTestCase("Hidden 1: Punctuation & Spacing", "OpenSource AI Interview OS", "SO weivretnI IA ecruoSnepO", 1),
                            new ProblemDocument.HiddenTestCase("Hidden 2: Numeric Sequence", "1234567890", "0987654321", 2)
                    ))
                    .limits(new ProblemDocument.ExecutionLimits(512, 2000))
                    .build();

            // 3. Two Sum
            ProblemDocument twoSum = ProblemDocument.builder()
                    .problemSlug("two-sum")
                    .title("Two Sum")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("MID")
                    .problemStatement("Given an array of integers on line 1 and a target integer on line 2, print the indices of the two numbers that sum to target (space-separated, e.g. '0 1').")
                    .starterCode(Map.of(
                            "java", """
                                    import java.util.Scanner;
                                    import java.util.HashMap;
                                    import java.util.Map;

                                    public class Main {
                                        public static void main(String[] args) {
                                            Scanner scanner = new Scanner(System.in);
                                            if (scanner.hasNextLine()) {
                                                String[] parts = scanner.nextLine().trim().split("\\\\s+");
                                                int target = Integer.parseInt(scanner.nextLine().trim());
                                                // TODO: Implement O(n) Two Sum and print "i j"
                                                System.out.println("0 1");
                                            }
                                        }
                                    }
                                    """,
                            "python", """
                                      import sys

                                      def main():
                                          lines = sys.stdin.read().splitlines()
                                          if len(lines) >= 2:
                                              nums = [int(x) for x in lines[0].split()]
                                              target = int(lines[1])
                                              # TODO: Implement Two Sum and print "i j"
                                              print("0 1")

                                      if __name__ == '__main__':
                                          main()
                                      """
                    ))
                    .sampleTests(List.of(
                            new ProblemDocument.TestCase("Sample 1: Basic Target", "2 7 11 15\n9", "0 1"),
                            new ProblemDocument.TestCase("Sample 2: Unsorted Array", "3 2 4\n6", "1 2")
                    ))
                    .hiddenTests(List.of(
                            new ProblemDocument.HiddenTestCase("Hidden 1: Duplicate Values", "3 3\n6", "0 1", 1),
                            new ProblemDocument.HiddenTestCase("Hidden 2: Negative Numbers", "-3 4 3 90\n0", "0 2", 2)
                    ))
                    .limits(new ProblemDocument.ExecutionLimits(512, 2000))
                    .build();

            // Upsert / Save
            for (ProblemDocument p : List.of(lruCache, reverseString, twoSum)) {
                problemRepository.findByProblemSlug(p.getProblemSlug())
                        .ifPresentOrElse(
                                existing -> {
                                    p.setId(existing.getId());
                                    problemRepository.save(p);
                                },
                                () -> problemRepository.save(p)
                        );
            }
            log.info("Problem catalog synchronized with {} problems.", 3);
        } catch (Exception e) {
            log.warn("⚠️ Problem library initialization notice: {}", e.getMessage());
        }
    }
}
