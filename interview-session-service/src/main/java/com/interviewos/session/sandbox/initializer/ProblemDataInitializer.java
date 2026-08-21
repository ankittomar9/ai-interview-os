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
            if (problemRepository.count() == 0) {
                log.info("Seeding initial technical interview problem library with standard I/O contracts...");

                // 1. Reverse a String (Standard I/O)
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

                // 2. Two Sum (Standard I/O: Line 1 array elements, Line 2 target)
                ProblemDocument twoSum = ProblemDocument.builder()
                        .problemSlug("two-sum")
                        .title("Two Sum")
                        .track("ALGORITHMS_DATA_STRUCTURES")
                        .difficulty("MID")
                        .problemStatement("Given an array of integers on line 1 and a target integer on line 2, print the indices of the two numbers such that they add up to the target (space-separated, e.g. '0 1').")
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

                problemRepository.saveAll(List.of(reverseString, twoSum));
                log.info("Successfully seeded {} interview problems into MongoDB.", 2);
            }
        } catch (Exception e) {
            log.warn("⚠️ Problem library initialization notice: {}", e.getMessage());
        }
    }
}
