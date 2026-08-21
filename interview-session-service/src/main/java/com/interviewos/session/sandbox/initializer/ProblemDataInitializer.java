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
                log.info("Seeding initial technical interview problem library into MongoDB...");

                // 1. Reverse a String
                ProblemDocument reverseString = ProblemDocument.builder()
                        .problemSlug("reverse-a-string")
                        .title("Reverse a String")
                        .track("ALGORITHMS_DATA_STRUCTURES")
                        .difficulty("JUNIOR")
                        .problemStatement("Write a function that takes a string as input and returns the reversed string without using built-in functions.")
                        .starterCode(Map.of(
                                "java", "public class ReverseString {\n    public static String reverse(String str) {\n        // Your code here\n        return str;\n    }\n}",
                                "python", "def reverse_string(s: str) -> str:\n    # Your code here\n    return s"
                        ))
                        .sampleTests(List.of(
                                new ProblemDocument.TestCase("Sample 1: Basic Inversion", "Hello, World!", "!dlroW ,olleH"),
                                new ProblemDocument.TestCase("Sample 2: Palindrome", "racecar", "racecar")
                        ))
                        .hiddenTests(List.of(
                                new ProblemDocument.HiddenTestCase("Hidden 1: Null / Empty Guard", "", "", 1),
                                new ProblemDocument.HiddenTestCase("Hidden 2: Large Buffer Inversion", "large_input", "large_reversed", 2)
                        ))
                        .limits(new ProblemDocument.ExecutionLimits(512, 2000))
                        .build();

                // 2. LRU Cache
                ProblemDocument lruCache = ProblemDocument.builder()
                        .problemSlug("lru-cache")
                        .title("LRU Cache")
                        .track("ALGORITHMS_DATA_STRUCTURES")
                        .difficulty("SENIOR")
                        .problemStatement("Design and implement a data structure for Least Recently Used (LRU) cache with O(1) time complexity get and put operations.")
                        .starterCode(Map.of(
                                "java", "public class LRUCache {\n    public LRUCache(int capacity) {\n        // Initialize\n    }\n    public int get(int key) {\n        return -1;\n    }\n    public void put(int key, int value) {}\n}",
                                "python", "class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n    def get(self, key: int) -> int:\n        return -1\n    def put(self, key: int, value: int) -> None:\n        pass"
                        ))
                        .sampleTests(List.of(
                                new ProblemDocument.TestCase("Sample 1: Basic Get / Put", "capacity=2, put(1,1), put(2,2), get(1)", "1"),
                                new ProblemDocument.TestCase("Sample 2: Eviction Check", "put(3,3) -> evicts 2, get(2)", "-1")
                        ))
                        .hiddenTests(List.of(
                                new ProblemDocument.HiddenTestCase("Hidden 1: High-Frequency Read Eviction", "sequence", "expected", 2),
                                new ProblemDocument.HiddenTestCase("Hidden 2: Zero Capacity Edge Case", "capacity=0", "exception", 1)
                        ))
                        .limits(new ProblemDocument.ExecutionLimits(512, 2000))
                        .build();

                problemRepository.saveAll(List.of(reverseString, lruCache));
                log.info("Successfully seeded {} interview problems into MongoDB.", 2);
            }
        } catch (Exception e) {
            log.warn("⚠️ Problem library initialization notice: {}", e.getMessage());
        }
    }
}
