---
slug: lld-unix-file-search
title: Design a Unix File Search Command (find)
track: SPRING_LLD
difficulty: MEDIUM
topics:
- lld
est_minutes: 35
tags:
- object-oriented-design
- lld
- java
- design-patterns
- specification-pattern
- composite-pattern
- file-system
buildProfile: maven-workspace
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the Composite Pattern to represent the hierarchical file system (Directory contains File and Directory nodes).
- Use the Specification / Filter Pattern to model individual search criteria (SizeFilter, NameFilter, ExtensionFilter).
- Support boolean compositions (AndFilter, OrFilter, NotFilter) to allow arbitrary logical chaining of search predicates.
coaching:
  presentationTips:
  - Explain how the Open/Closed Principle allows adding new filters (e.g., OwnerFilter, ModifiedTimeFilter) without modifying existing search engine code.
  - Discuss directory recursion versus iterative stack-based traversal for deeply nested file trees to avoid stack overflow.
  - Explain how short-circuit evaluation in AND/OR filters optimizes performance on massive directories.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>unix-file-search</artifactId>
        <version>1.0.0</version>
        <properties>
            <maven.compiler.source>21</maven.compiler.source>
            <maven.compiler.target>21</maven.compiler.target>
            <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
            <junit.jupiter.version>5.11.4</junit.jupiter.version>
        </properties>
        <dependencies>
            <dependency>
                <groupId>org.junit.jupiter</groupId>
                <artifactId>junit-jupiter</artifactId>
                <version>${junit.jupiter.version}</version>
                <scope>test</scope>
            </dependency>
        </dependencies>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-resources-plugin</artifactId>
                    <version>3.3.1</version>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>3.13.0</version>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-surefire-plugin</artifactId>
                    <version>3.5.2</version>
                </plugin>
            </plugins>
        </build>
    </project>
  README.md: |
    # Unix File Search Command (find)

    ## Overview
    Implement an object-oriented Unix File Search engine using the Specification / Filter pattern and Composite pattern to search hierarchical directories.

    ## Key Components
    - `com.interviewos.filesearch.model.File`: File tree composite node.
    - `com.interviewos.filesearch.predicate.*`: Simple and composite boolean search filters.
    - `com.interviewos.filesearch.service.FileSearch`: Recursive or iterative directory search coordinator.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/filesearch/service/FileSearch.java`
    2. `src/main/java/com/interviewos/filesearch/predicate/SimplePredicate.java`
    3. `src/main/java/com/interviewos/filesearch/predicate/AndPredicate.java`
  src/main/java/com/interviewos/filesearch/model/FileAttribute.java: |
    package com.interviewos.filesearch.model;

    public enum FileAttribute {
        IS_DIRECTORY,
        SIZE,
        OWNER,
        FILENAME
    }
  src/main/java/com/interviewos/filesearch/model/File.java: |
    package com.interviewos.filesearch.model;

    import java.util.*;

    public class File {
        private final boolean isDirectory;
        private final int size;
        private final String owner;
        private final String filename;
        private final List<File> entries = new ArrayList<>();

        public File(boolean isDirectory, int size, String owner, String filename) {
            this.isDirectory = isDirectory;
            this.size = size;
            this.owner = owner;
            this.filename = filename;
        }

        public Object extract(FileAttribute attribute) {
            return switch (attribute) {
                case IS_DIRECTORY -> isDirectory;
                case SIZE -> size;
                case OWNER -> owner;
                case FILENAME -> filename;
            };
        }

        public void addEntry(File child) {
            if (child != null) {
                entries.add(child);
            }
        }

        public boolean isDirectory() { return isDirectory; }
        public int getSize() { return size; }
        public String getOwner() { return owner; }
        public String getFilename() { return filename; }
        public List<File> getEntries() { return Collections.unmodifiableList(entries); }
    }
  src/main/java/com/interviewos/filesearch/predicate/ComparisonOperator.java: |
    package com.interviewos.filesearch.predicate;

    public interface ComparisonOperator<T> {
        boolean isMatch(T actual, T expected);
    }
  src/main/java/com/interviewos/filesearch/predicate/EqualsOperator.java: |
    package com.interviewos.filesearch.predicate;

    import java.util.Objects;

    public class EqualsOperator<T> implements ComparisonOperator<T> {
        @Override
        public boolean isMatch(T actual, T expected) {
            return Objects.equals(actual, expected);
        }
    }
  src/main/java/com/interviewos/filesearch/predicate/GreaterThanOperator.java: |
    package com.interviewos.filesearch.predicate;

    public class GreaterThanOperator<T extends Number> implements ComparisonOperator<T> {
        @Override
        public boolean isMatch(T actual, T expected) {
            return actual != null && expected != null && actual.doubleValue() > expected.doubleValue();
        }
    }
  src/main/java/com/interviewos/filesearch/predicate/RegexMatchOperator.java: |
    package com.interviewos.filesearch.predicate;

    import java.util.regex.Pattern;

    public class RegexMatchOperator implements ComparisonOperator<String> {
        @Override
        public boolean isMatch(String actual, String pattern) {
            return actual != null && pattern != null && Pattern.matches(pattern, actual);
        }
    }
  src/main/java/com/interviewos/filesearch/predicate/Predicate.java: |
    package com.interviewos.filesearch.predicate;

    import com.interviewos.filesearch.model.File;

    public interface Predicate {
        boolean isMatch(File file);
    }
  src/main/java/com/interviewos/filesearch/predicate/SimplePredicate.java: |
    package com.interviewos.filesearch.predicate;

    import com.interviewos.filesearch.model.File;
    import com.interviewos.filesearch.model.FileAttribute;

    public class SimplePredicate<T> implements Predicate {
        private final FileAttribute attribute;
        private final ComparisonOperator<T> operator;
        private final T expectedValue;

        public SimplePredicate(FileAttribute attribute, ComparisonOperator<T> operator, T expectedValue) {
            this.attribute = attribute;
            this.operator = operator;
            this.expectedValue = expectedValue;
        }

        @Override
        public boolean isMatch(File file) {
            // TODO: Extract attribute value from file and evaluate via operator against expectedValue
            throw new UnsupportedOperationException("TODO: Implement isMatch");
        }
    }
  src/main/java/com/interviewos/filesearch/predicate/AndPredicate.java: |
    package com.interviewos.filesearch.predicate;

    import com.interviewos.filesearch.model.File;
    import java.util.List;

    public class AndPredicate implements Predicate {
        private final List<Predicate> operands;

        public AndPredicate(List<Predicate> operands) {
            this.operands = operands != null ? operands : List.of();
        }

        @Override
        public boolean isMatch(File file) {
            // TODO: Return true if all operands match file
            throw new UnsupportedOperationException("TODO: Implement isMatch in AndPredicate");
        }
    }
  src/main/java/com/interviewos/filesearch/predicate/FileSearchCriteria.java: |
    package com.interviewos.filesearch.predicate;

    import com.interviewos.filesearch.model.File;

    public class FileSearchCriteria {
        private final Predicate predicate;

        public FileSearchCriteria(Predicate predicate) {
            this.predicate = predicate;
        }

        public boolean isMatch(File file) {
            return predicate != null && predicate.isMatch(file);
        }
    }
  src/main/java/com/interviewos/filesearch/service/FileSearch.java: |
    package com.interviewos.filesearch.service;

    import com.interviewos.filesearch.model.File;
    import com.interviewos.filesearch.predicate.FileSearchCriteria;
    import java.util.ArrayList;
    import java.util.List;

    public class FileSearch {
        public List<File> search(File root, FileSearchCriteria criteria) {
            // TODO: Recursively traverse directory tree and collect all matching File nodes
            throw new UnsupportedOperationException("TODO: Implement search");
        }
    }
editablePaths:
- src/main/java/com/interviewos/filesearch/service/FileSearch.java
- src/main/java/com/interviewos/filesearch/predicate/SimplePredicate.java
- src/main/java/com/interviewos/filesearch/predicate/AndPredicate.java
hiddenTestFiles:
  src/test/java/com/interviewos/filesearch/FileSearchCriteriaTest.java: |
    package com.interviewos.filesearch;

    import com.interviewos.filesearch.model.File;
    import com.interviewos.filesearch.model.FileAttribute;
    import com.interviewos.filesearch.predicate.*;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class FileSearchCriteriaTest {
        @Test
        @DisplayName("SimplePredicate matches file size and name regex")
        void testSimplePredicateMatching() {
            File f1 = new File(false, 500, "alice", "report.pdf");

            SimplePredicate<Integer> sizePred = new SimplePredicate<>(FileAttribute.SIZE, new GreaterThanOperator<>(), 200);
            assertTrue(sizePred.isMatch(f1));

            SimplePredicate<String> namePred = new SimplePredicate<>(FileAttribute.FILENAME, new RegexMatchOperator(), ".*\\.pdf");
            assertTrue(namePred.isMatch(f1));
        }
    }
  src/test/java/com/interviewos/filesearch/CompositePredicateTest.java: |
    package com.interviewos.filesearch;

    import com.interviewos.filesearch.model.File;
    import com.interviewos.filesearch.model.FileAttribute;
    import com.interviewos.filesearch.predicate.*;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class CompositePredicateTest {
        @Test
        @DisplayName("AndPredicate requires both child predicates to match")
        void testAndComposition() {
            File file = new File(false, 1024, "root", "system.log");

            Predicate p1 = new SimplePredicate<>(FileAttribute.OWNER, new EqualsOperator<>(), "root");
            Predicate p2 = new SimplePredicate<>(FileAttribute.SIZE, new GreaterThanOperator<>(), 500);
            Predicate p3 = new SimplePredicate<>(FileAttribute.FILENAME, new RegexMatchOperator(), ".*\\.tmp");

            AndPredicate matchingAnd = new AndPredicate(List.of(p1, p2));
            assertTrue(matchingAnd.isMatch(file));

            AndPredicate failingAnd = new AndPredicate(List.of(p1, p3));
            assertFalse(failingAnd.isMatch(file));
        }
    }
  src/test/java/com/interviewos/filesearch/FileSearchRecursionTest.java: |
    package com.interviewos.filesearch;

    import com.interviewos.filesearch.model.File;
    import com.interviewos.filesearch.model.FileAttribute;
    import com.interviewos.filesearch.predicate.*;
    import com.interviewos.filesearch.service.FileSearch;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class FileSearchRecursionTest {
        @Test
        @DisplayName("FileSearch traverses nested directories and finds all matching files")
        void testRecursiveSearch() {
            File root = new File(true, 0, "root", "/");
            File home = new File(true, 0, "root", "home");
            File doc1 = new File(false, 100, "john", "a.txt");
            File doc2 = new File(false, 300, "john", "b.txt");
            File hidden = new File(false, 50, "john", ".secret");

            home.addEntry(doc1);
            home.addEntry(doc2);
            home.addEntry(hidden);
            root.addEntry(home);

            FileSearch searcher = new FileSearch();
            Predicate txtPred = new SimplePredicate<>(FileAttribute.FILENAME, new RegexMatchOperator(), ".*\\.txt");
            List<File> results = searcher.search(root, new FileSearchCriteria(txtPred));

            assertEquals(2, results.size());
        }
    }

starterCode: "// Represents a file or directory in the file system\n// Contains basic file attributes and supports hierarchical structure\npublic class File {\n    private final boolean isDirectory;\n    private final int size;\n    private final String owner;\n    private final String filename;\n    // Set of directory entries (files and subdirectories)\nprivate final Set<File> entries = new HashSet<>();\n    // Creates a new file with the specified attributes\npublic File(\n            final boolean isDirectory,\n            final int size,\n            final String owner,\n            final String filename) {\n        this.isDirectory = isDirectory;\n        this.size = size;\n        this.owner = owner;\n        this.filename = filename;\n    }\n    // Extracts the value of a specified file attribute\npublic Object extract(final FileAttribute attributeName) {\n        switch (attributeName) {\n            case SIZE -> {\n                return size;\n            }\n            case OWNER\
  \ -> {\n                return owner;\n            }\n            case IS_DIRECTORY -> {\n                return isDirectory;\n            }\n            case FILENAME -> {\n                return filename;\n            }\n        }\n        throw new IllegalArgumentException(\"invalid filter criteria type\");\n    }\n    // Adds a file or directory entry to this directory\npublic void addEntry(final File entry) {\n        entries.add(entry);\n    }\n    // getter methods omitted for brevity\n}\n// Represents the different attributes that can be checked for a file\npublic enum FileAttribute {\n    IS_DIRECTORY,\n    SIZE,\n    OWNER,\n    FILENAME\n}\n\n// Base interface for all file search predicates\npublic interface Predicate {\n    // Checks if the given file matches the search condition\nboolean isMatch(final File inputFile);\n}\n\n// Base interface for all comparison operations in the file search system\npublic interface ComparisonOperator<T> {\n    boolean isMatch(final T attributeValue,\
  \ final T expectedValue);\n}"
solutionCode: "// Represents a file or directory in the file system\n// Contains basic file attributes and supports hierarchical structure\npublic class File {\n    private final boolean isDirectory;\n    private final int size;\n    private final String owner;\n    private final String filename;\n    // Set of directory entries (files and subdirectories)\nprivate final Set<File> entries = new HashSet<>();\n    // Creates a new file with the specified attributes\npublic File(\n            final boolean isDirectory,\n            final int size,\n            final String owner,\n            final String filename) {\n        this.isDirectory = isDirectory;\n        this.size = size;\n        this.owner = owner;\n        this.filename = filename;\n    }\n    // Extracts the value of a specified file attribute\npublic Object extract(final FileAttribute attributeName) {\n        switch (attributeName) {\n            case SIZE -> {\n                return size;\n            }\n            case\
  \ OWNER -> {\n                return owner;\n            }\n            case IS_DIRECTORY -> {\n                return isDirectory;\n            }\n            case FILENAME -> {\n                return filename;\n            }\n        }\n        throw new IllegalArgumentException(\"invalid filter criteria type\");\n    }\n    // Adds a file or directory entry to this directory\npublic void addEntry(final File entry) {\n        entries.add(entry);\n    }\n    // getter methods omitted for brevity\n}\n// Represents the different attributes that can be checked for a file\npublic enum FileAttribute {\n    IS_DIRECTORY,\n    SIZE,\n    OWNER,\n    FILENAME\n}\n\n// Base interface for all file search predicates\npublic interface Predicate {\n    // Checks if the given file matches the search condition\nboolean isMatch(final File inputFile);\n}\n\n// Base interface for all comparison operations in the file search system\npublic interface ComparisonOperator<T> {\n    boolean isMatch(final T\
  \ attributeValue, final T expectedValue);\n}\n\n// Implements exact equality comparison between values\npublic class EqualsOperator<T> implements ComparisonOperator<T> {\n    @Override\n    public boolean isMatch(final T attributeValue, final T expectedValue) {\n        return Objects.equals(attributeValue, expectedValue);\n    }\n}\n// Implements greater than comparison for numeric values\nclass GreaterThanOperator<T extends Number> implements ComparisonOperator<T> {\n    @Override\n    public boolean isMatch(final T attributeValue, final T expectedValue) {\n        return Double.compare(attributeValue.doubleValue(), expectedValue.doubleValue()) > 0;\n    }\n}\n// Implements less than comparison for numeric values\nclass LessThanOperator<T extends Number> implements ComparisonOperator<T> {\n    @Override\n    public boolean isMatch(final T attributeValue, final T expectedValue) {\n        return Double.compare(attributeValue.doubleValue(), expectedValue.doubleValue()) < 0;\n    }\n}\n\
  // Implements regular expression pattern matching for string values\npublic class RegexMatchOperator<T extends String> implements ComparisonOperator<T> {\n    @Override\n    public boolean isMatch(final T attributeValue, final T expectedValue) {\n        final Pattern\np\n= Pattern.compile(expectedValue);\n        return p.matcher(attributeValue).matches();\n    }\n}\n\n// A basic predicate that compares a file attribute with an expected value\npublic class SimplePredicate<T> implements Predicate {\n    // The name of the file attribute to check\nprivate final FileAttribute attributeName;\n    // The operator to use for comparison (equals, contains, greater than, etc.)\nprivate final ComparisonOperator<T> operator;\n    // The expected value to compare against\n    T expectedValue;\n    // Creates a new simple predicate with the specified attribute, operator, and\n// expected value\npublic SimplePredicate(\n            final FileAttribute attributeName,\n            final ComparisonOperator<T>\
  \ operator,\n            final T expectedValue) {\n        this.attributeName = attributeName;\n        this.operator = operator;\n        this.expectedValue = expectedValue;\n    }\n    @Override\n    public boolean isMatch(final File inputFile) {\n        // Extract the actual value of the attribute from the file\nObject\nactualValue\n= inputFile.extract(attributeName);\n        // Check if the actual value is of the correct type\nif (expectedValue.getClass().isInstance(actualValue)) {\n            // Perform the comparison using the specified operator\nreturn operator.isMatch((T) actualValue, expectedValue);\n        } else {\n            return false;\n        }\n    }\n}\n\npublic interface CompositePredicate\nextends Predicate {\n    // This interface is intentionally empty as it serves as a marker\n// to identify predicates that combine multiple other predicates (AND, OR, NOT)\n}\n// Implements logical AND operation between multiple predicates\npublic class AndPredicate\nimplements\
  \ CompositePredicate {\n    // List of predicates that must all match for this predicate to match\nprivate final List<Predicate> operands;\n    // Creates a new AND predicate with the specified predicates\npublic AndPredicate(final List<Predicate> operands) {\n        this.operands = operands;\n    }\n    // Checks if the given file matches ALL predicates\n@Override\n    public boolean isMatch(final File inputFile) {\n        return operands.stream().allMatch(predicate -> predicate.isMatch(inputFile));\n    }\n}\n// Implements logical OR operation between multiple predicates\npublic class OrPredicate\nimplements CompositePredicate {\n    // List of predicates, at least one of which must match\nprivate final List<Predicate> operands;\n    // Creates a new OR predicate with the specified predicates\npublic OrPredicate(final List<Predicate> operands) {\n        this.operands = operands;\n    }\n    @Override\n    public boolean isMatch(final File inputFile) {\n        return operands.stream().anyMatch(predicate\
  \ -> predicate.isMatch(inputFile));\n    }\n}\n// Implements logical NOT operation on a predicate\npublic class NotPredicate\nimplements CompositePredicate {\n    // The predicate to negate\nprivate final Predicate operand;\n    // Creates a new NOT predicate with the specified predicate to negate\npublic NotPredicate(final Predicate operand) {\n        this.operand = operand;\n    }\n    @Override\n    public boolean isMatch(final File inputFile) {\n        return !operand.isMatch(inputFile);\n    }\n}\n\n// Wrapper class that encapsulates a search condition for file matching\npublic class FileSearchCriteria {\n    // The predicate that defines what makes a file match\nprivate final Predicate predicate;\n    // Constructor that takes a predicate defining the criteria\npublic FileSearchCriteria(final Predicate predicate) {\n        this.predicate = predicate;\n    }\n    // Checks if the given file matches the search criteria\npublic boolean isMatch(final File inputFile) {\n        return\
  \ predicate.isMatch(inputFile);\n    }\n}\n\n// Main class responsible for performing file system searches\npublic class FileSearch {\n    // Performs a recursive search through the file system starting from root\n// Returns a list of files that match the given criteria\npublic List<File> search(final File root, final FileSearchCriteria criteria) {\n        // List to store matching files\nfinal List<File> result = new ArrayList<>();\n        // Stack to handle recursive traversal without actual recursion\nfinal ArrayDeque<File> recursionStack = new ArrayDeque<>();\n        // Start with the root directory\n        recursionStack.add(root);\n        // Continue until we've processed all files\nwhile (!recursionStack.isEmpty()) {\n            // Get the next file to process\nFile\nnext\n= recursionStack.pop();\n            // Check if the file matches our criteria\nif (criteria.isMatch(next)) {\n                result.add(next);\n            }\n            // Add all directory entries to\
  \ the stack for processing\nfor (File entry : next.getEntries()) {\n                recursionStack.push(entry);\n            }\n        }\n        return result;\n    }\n}\n\npublic class FileSearchTest {\n    @Test\npublic void testFileSearch() {\n        // Create a root directory and two files with different owners\nfinal File\nroot\n=\nnew File(true, 0, \"adam\", \"root\");\n        final File\na\n=\nnew File(false, 2000, \"adam\", \"a\");\n        final File\nb\n=\nnew File(false, 3000, \"george\", \"b\");\n        // Add files to the root directory\n        root.addEntry(a);\n        root.addEntry(b);\n        // Search criteria: Find non-directory files owned by users matching \"ge.*\"\nfinal FileSearchCriteria\ncriteria\n=\nnew FileSearchCriteria(\n                        new AndPredicate(\n                                List.of(\n                                        new SimplePredicate<>(\n                                                FileAttribute.IS_DIRECTORY,\n      \
  \                                          new EqualsOperator<>(),\n                                                false),\n                                        new SimplePredicate<>(\n                                                FileAttribute.OWNER,\n                                                new RegexMatchOperator<>(),\n                                                \"ge.*\"))));\n        // Execute the search and get results\nfinal FileSearch\nfileSearch\n=\nnew FileSearch();\n        final List<File> result = fileSearch.search(root, criteria);\n        // Verify that only one file matches the criteria\n        assertEquals(1, result.size());\n        // Verify that the matching file is \"b\"\n        assertEquals(\"b\", result.get(0).getFilename());\n    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Unix File Search Command (find)


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Specification / Filter Pattern (Search Predicates), Composite Pattern (Files and Directories)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires adding new implementations without modifying the core coordinator classes.'
referenceSolutions:
- approachId: canonical-unix-file-search
  label: Canonical — Design a Unix File Search Command (find)
  approachClass: PRIMARY
  kind: CODE
  summary: Standard modular object-oriented architecture accepted in technical interviews.
  keyIdea: Optimal separation of concerns with domain entities and state orchestration.
  timeComplexity: O(1)
  spaceComplexity: O(N)
  tradeoffs:
  - Clean encapsulation and single-responsibility principles
  - High maintainability and readability during interview walkthrough
  whenToUse: Default expected interview-grade solution for this problem statement.
  code: "// Represents a file or directory in the file system\n// Contains basic file attributes and supports hierarchical structure\npublic class File {\n    private final boolean isDirectory;\n    private final int size;\n    private final String owner;\n    private final String filename;\n    // Set of directory entries (files and subdirectories)\nprivate final Set<File> entries = new HashSet<>();\n    // Creates a new file with the specified attributes\npublic File(\n            final boolean isDirectory,\n            final int size,\n            final String owner,\n            final String filename) {\n        this.isDirectory = isDirectory;\n        this.size = size;\n        this.owner = owner;\n        this.filename = filename;\n    }\n    // Extracts the value of a specified file attribute\npublic Object extract(final FileAttribute attributeName) {\n        switch (attributeName) {\n            case SIZE -> {\n                return size;\n            }\n            case OWNER\
    \ -> {\n                return owner;\n            }\n            case IS_DIRECTORY -> {\n                return isDirectory;\n            }\n            case FILENAME -> {\n                return filename;\n            }\n        }\n        throw new IllegalArgumentException(\"invalid filter criteria type\");\n    }\n    // Adds a file or directory entry to this directory\npublic void addEntry(final File entry) {\n        entries.add(entry);\n    }\n    // getter methods omitted for brevity\n}\n// Represents the different attributes that can be checked for a file\npublic enum FileAttribute {\n    IS_DIRECTORY,\n    SIZE,\n    OWNER,\n    FILENAME\n}\n\n// Base interface for all file search predicates\npublic interface Predicate {\n    // Checks if the given file matches the search condition\nboolean isMatch(final File inputFile);\n}\n\n// Base interface for all comparison operations in the file search system\npublic interface ComparisonOperator<T> {\n    boolean isMatch(final T attributeValue,\
    \ final T expectedValue);\n}\n\n// Implements exact equality comparison between values\npublic class EqualsOperator<T> implements ComparisonOperator<T> {\n    @Override\n    public boolean isMatch(final T attributeValue, final T expectedValue) {\n        return Objects.equals(attributeValue, expectedValue);\n    }\n}\n// Implements greater than comparison for numeric values\nclass GreaterThanOperator<T extends Number> implements ComparisonOperator<T> {\n    @Override\n    public boolean isMatch(final T attributeValue, final T expectedValue) {\n        return Double.compare(attributeValue.doubleValue(), expectedValue.doubleValue()) > 0;\n    }\n}\n// Implements less than comparison for numeric values\nclass LessThanOperator<T extends Number> implements ComparisonOperator<T> {\n    @Override\n    public boolean isMatch(final T attributeValue, final T expectedValue) {\n        return Double.compare(attributeValue.doubleValue(), expectedValue.doubleValue()) < 0;\n    }\n}\n// Implements\
    \ regular expression pattern matching for string values\npublic class RegexMatchOperator<T extends String> implements ComparisonOperator<T> {\n    @Override\n    public boolean isMatch(final T attributeValue, final T expectedValue) {\n        final Pattern\np\n= Pattern.compile(expectedValue);\n        return p.matcher(attributeValue).matches();\n    }\n}\n\n// A basic predicate that compares a file attribute with an expected value\npublic class SimplePredicate<T> implements Predicate {\n    // The name of the file attribute to check\nprivate final FileAttribute attributeName;\n    // The operator to use for comparison (equals, contains, greater than, etc.)\nprivate final ComparisonOperator<T> operator;\n    // The expected value to compare against\n    T expectedValue;\n    // Creates a new simple predicate with the specified attribute, operator, and\n// expected value\npublic SimplePredicate(\n            final FileAttribute attributeName,\n            final ComparisonOperator<T> operator,\n\
    \            final T expectedValue) {\n        this.attributeName = attributeName;\n        this.operator = operator;\n        this.expectedValue = expectedValue;\n    }\n    @Override\n    public boolean isMatch(final File inputFile) {\n        // Extract the actual value of the attribute from the file\nObject\nactualValue\n= inputFile.extract(attributeName);\n        // Check if the actual value is of the correct type\nif (expectedValue.getClass().isInstance(actualValue)) {\n            // Perform the comparison using the specified operator\nreturn operator.isMatch((T) actualValue, expectedValue);\n        } else {\n            return false;\n        }\n    }\n}\n\npublic interface CompositePredicate\nextends Predicate {\n    // This interface is intentionally empty as it serves as a marker\n// to identify predicates that combine multiple other predicates (AND, OR, NOT)\n}\n// Implements logical AND operation between multiple predicates\npublic class AndPredicate\nimplements CompositePredicate\
    \ {\n    // List of predicates that must all match for this predicate to match\nprivate final List<Predicate> operands;\n    // Creates a new AND predicate with the specified predicates\npublic AndPredicate(final List<Predicate> operands) {\n        this.operands = operands;\n    }\n    // Checks if the given file matches ALL predicates\n@Override\n    public boolean isMatch(final File inputFile) {\n        return operands.stream().allMatch(predicate -> predicate.isMatch(inputFile));\n    }\n}\n// Implements logical OR operation between multiple predicates\npublic class OrPredicate\nimplements CompositePredicate {\n    // List of predicates, at least one of which must match\nprivate final List<Predicate> operands;\n    // Creates a new OR predicate with the specified predicates\npublic OrPredicate(final List<Predicate> operands) {\n        this.operands = operands;\n    }\n    @Override\n    public boolean isMatch(final File inputFile) {\n        return operands.stream().anyMatch(predicate\
    \ -> predicate.isMatch(inputFile));\n    }\n}\n// Implements logical NOT operation on a predicate\npublic class NotPredicate\nimplements CompositePredicate {\n    // The predicate to negate\nprivate final Predicate operand;\n    // Creates a new NOT predicate with the specified predicate to negate\npublic NotPredicate(final Predicate operand) {\n        this.operand = operand;\n    }\n    @Override\n    public boolean isMatch(final File inputFile) {\n        return !operand.isMatch(inputFile);\n    }\n}\n\n// Wrapper class that encapsulates a search condition for file matching\npublic class FileSearchCriteria {\n    // The predicate that defines what makes a file match\nprivate final Predicate predicate;\n    // Constructor that takes a predicate defining the criteria\npublic FileSearchCriteria(final Predicate predicate) {\n        this.predicate = predicate;\n    }\n    // Checks if the given file matches the search criteria\npublic boolean isMatch(final File inputFile) {\n        return\
    \ predicate.isMatch(inputFile);\n    }\n}\n\n// Main class responsible for performing file system searches\npublic class FileSearch {\n    // Performs a recursive search through the file system starting from root\n// Returns a list of files that match the given criteria\npublic List<File> search(final File root, final FileSearchCriteria criteria) {\n        // List to store matching files\nfinal List<File> result = new ArrayList<>();\n        // Stack to handle recursive traversal without actual recursion\nfinal ArrayDeque<File> recursionStack = new ArrayDeque<>();\n        // Start with the root directory\n        recursionStack.add(root);\n        // Continue until we've processed all files\nwhile (!recursionStack.isEmpty()) {\n            // Get the next file to process\nFile\nnext\n= recursionStack.pop();\n            // Check if the file matches our criteria\nif (criteria.isMatch(next)) {\n                result.add(next);\n            }\n            // Add all directory entries\
    \ to the stack for processing\nfor (File entry : next.getEntries()) {\n                recursionStack.push(entry);\n            }\n        }\n        return result;\n    }\n}\n\npublic class FileSearchTest {\n    @Test\npublic void testFileSearch() {\n        // Create a root directory and two files with different owners\nfinal File\nroot\n=\nnew File(true, 0, \"adam\", \"root\");\n        final File\na\n=\nnew File(false, 2000, \"adam\", \"a\");\n        final File\nb\n=\nnew File(false, 3000, \"george\", \"b\");\n        // Add files to the root directory\n        root.addEntry(a);\n        root.addEntry(b);\n        // Search criteria: Find non-directory files owned by users matching \"ge.*\"\nfinal FileSearchCriteria\ncriteria\n=\nnew FileSearchCriteria(\n                        new AndPredicate(\n                                List.of(\n                                        new SimplePredicate<>(\n                                                FileAttribute.IS_DIRECTORY,\n \
    \                                               new EqualsOperator<>(),\n                                                false),\n                                        new SimplePredicate<>(\n                                                FileAttribute.OWNER,\n                                                new RegexMatchOperator<>(),\n                                                \"ge.*\"))));\n        // Execute the search and get results\nfinal FileSearch\nfileSearch\n=\nnew FileSearch();\n        final List<File> result = fileSearch.search(root, criteria);\n        // Verify that only one file matches the criteria\n        assertEquals(1, result.size());\n        // Verify that the matching file is \"b\"\n        assertEquals(\"b\", result.get(0).getFilename());\n    }\n}"
- approachId: visitor-pattern-file-search
  label: Alternate — Visitor Pattern over FileSystem Node Hierarchy
  approachClass: ALTERNATE
  kind: CODE
  summary: Implements the classic Visitor pattern to traverse file system hierarchies. Specialized visitors (e.g. NameFilterVisitor, SizeFilterVisitor, ContentGrepVisitor) collect matching nodes without altering the underlying file composite hierarchy.
  keyIdea: Decouple file search criteria and actions from directory traversal using the Visitor pattern across DirectoryNode and FileNode composite structures.
  timeComplexity: O(T)
  spaceComplexity: O(D)
  tradeoffs:
  - New search operations or actions can be added without modifying node classes
  - Adding new file system node types requires updating the Visitor interface
  whenToUse: File indexing systems, batch file analyzers, and command-line search tools.
  code: "// Alternate Approach: Visitor Pattern over FileSystem Node Hierarchy\nimport java.util.*;\n\ninterface FileSystemNode {\n    String getName();\n    long getSize();\n    void accept(FileSystemVisitor visitor);\n}\n\nclass FileNode implements FileSystemNode {\n    private final String name;\n    private final long size;\n\n    public FileNode(String name, long size) {\n        this.name = name;\n        this.size = size;\n    }\n\n    @Override public String getName() { return name; }\n    @Override public long getSize() { return size; }\n    @Override public void accept(FileSystemVisitor visitor) { visitor.visitFile(this); }\n}\n\nclass DirectoryNode implements FileSystemNode {\n    private final String name;\n    private final List<FileSystemNode> children = new ArrayList<>();\n\n    public DirectoryNode(String name) { this.name = name; }\n    public void addChild(FileSystemNode node) { children.add(node); }\n\n    @Override public String getName() { return name; }\n    @Override\
    \ public long getSize() { return children.stream().mapToLong(FileSystemNode::getSize).sum(); }\n    @Override\n    public void accept(FileSystemVisitor visitor) {\n        visitor.visitDirectory(this);\n        for (FileSystemNode child : children) {\n            child.accept(visitor);\n        }\n    }\n}\n\ninterface FileSystemVisitor {\n    void visitFile(FileNode file);\n    void visitDirectory(DirectoryNode dir);\n}\n\nclass ExtensionSearchVisitor implements FileSystemVisitor {\n    private final String targetExtension;\n    private final List<FileNode> matchedFiles = new ArrayList<>();\n\n    public ExtensionSearchVisitor(String targetExtension) {\n        this.targetExtension = targetExtension;\n    }\n\n    @Override\n    public void visitFile(FileNode file) {\n        if (file.getName().endsWith(targetExtension)) {\n            matchedFiles.add(file);\n        }\n    }\n\n    @Override public void visitDirectory(DirectoryNode dir) {}\n    public List<FileNode> getMatchedFiles()\
    \ { return matchedFiles; }\n}\n"
---

### Problem Statement: Design a Unix File Search Command (find)

Design an extensible Unix `find` command engine supporting multi-criteria search (name, size, extension, min/max bounds) with logical operators (AND, OR, NOT) over directory hierarchies.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design a Unix File Search Command (find).
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage Specification / Filter Pattern (Search Predicates), Composite Pattern (Files and Directories).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
