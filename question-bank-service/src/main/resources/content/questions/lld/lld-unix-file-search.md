---
slug: lld-unix-file-search
title: Design a Unix File Search Command (find)
track: SPRING_LLD
difficulty: MID
tags:
- object-oriented-design
- lld
- java
- design-patterns
- specification-pattern
- composite-pattern
- file-system
buildProfile: judge0
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Use the Composite Pattern to represent the hierarchical file system (Directory contains File and Directory nodes).
- Use the Specification / Filter Pattern to model individual search criteria (SizeFilter, NameFilter, ExtensionFilter).
- Support boolean compositions (AndFilter, OrFilter, NotFilter) to allow arbitrary logical chaining of search predicates.
coaching:
  presentationTips:
  - Explain how the Open/Closed Principle allows adding new filters (e.g., OwnerFilter, ModifiedTimeFilter) without modifying
    existing search engine code.
  - Discuss directory recursion versus iterative stack-based traversal for deeply nested file trees to avoid stack overflow.
  - Explain how short-circuit evaluation in AND/OR filters optimizes performance on massive directories.
starterCode: "// Represents a file or directory in the file system\n// Contains basic file attributes and supports hierarchical\
  \ structure\npublic class File {\n    private final boolean isDirectory;\n    private final int size;\n    private final\
  \ String owner;\n    private final String filename;\n    // Set of directory entries (files and subdirectories)\nprivate\
  \ final Set<File> entries = new HashSet<>();\n    // Creates a new file with the specified attributes\npublic File(\n  \
  \          final boolean isDirectory,\n            final int size,\n            final String owner,\n            final String\
  \ filename) {\n        this.isDirectory = isDirectory;\n        this.size = size;\n        this.owner = owner;\n       \
  \ this.filename = filename;\n    }\n    // Extracts the value of a specified file attribute\npublic Object extract(final\
  \ FileAttribute attributeName) {\n        switch (attributeName) {\n            case SIZE -> {\n                return size;\n\
  \            }\n            case OWNER -> {\n                return owner;\n            }\n            case IS_DIRECTORY\
  \ -> {\n                return isDirectory;\n            }\n            case FILENAME -> {\n                return filename;\n\
  \            }\n        }\n        throw new IllegalArgumentException(\"invalid filter criteria type\");\n    }\n    //\
  \ Adds a file or directory entry to this directory\npublic void addEntry(final File entry) {\n        entries.add(entry);\n\
  \    }\n    // getter methods omitted for brevity\n}\n// Represents the different attributes that can be checked for a file\n\
  public enum FileAttribute {\n    IS_DIRECTORY,\n    SIZE,\n    OWNER,\n    FILENAME\n}\n\n// Base interface for all file\
  \ search predicates\npublic interface Predicate {\n    // Checks if the given file matches the search condition\nboolean\
  \ isMatch(final File inputFile);\n}\n\n// Base interface for all comparison operations in the file search system\npublic\
  \ interface ComparisonOperator<T> {\n    boolean isMatch(final T attributeValue, final T expectedValue);\n}"
solutionCode: "// Represents a file or directory in the file system\n// Contains basic file attributes and supports hierarchical\
  \ structure\npublic class File {\n    private final boolean isDirectory;\n    private final int size;\n    private final\
  \ String owner;\n    private final String filename;\n    // Set of directory entries (files and subdirectories)\nprivate\
  \ final Set<File> entries = new HashSet<>();\n    // Creates a new file with the specified attributes\npublic File(\n  \
  \          final boolean isDirectory,\n            final int size,\n            final String owner,\n            final String\
  \ filename) {\n        this.isDirectory = isDirectory;\n        this.size = size;\n        this.owner = owner;\n       \
  \ this.filename = filename;\n    }\n    // Extracts the value of a specified file attribute\npublic Object extract(final\
  \ FileAttribute attributeName) {\n        switch (attributeName) {\n            case SIZE -> {\n                return size;\n\
  \            }\n            case OWNER -> {\n                return owner;\n            }\n            case IS_DIRECTORY\
  \ -> {\n                return isDirectory;\n            }\n            case FILENAME -> {\n                return filename;\n\
  \            }\n        }\n        throw new IllegalArgumentException(\"invalid filter criteria type\");\n    }\n    //\
  \ Adds a file or directory entry to this directory\npublic void addEntry(final File entry) {\n        entries.add(entry);\n\
  \    }\n    // getter methods omitted for brevity\n}\n// Represents the different attributes that can be checked for a file\n\
  public enum FileAttribute {\n    IS_DIRECTORY,\n    SIZE,\n    OWNER,\n    FILENAME\n}\n\n// Base interface for all file\
  \ search predicates\npublic interface Predicate {\n    // Checks if the given file matches the search condition\nboolean\
  \ isMatch(final File inputFile);\n}\n\n// Base interface for all comparison operations in the file search system\npublic\
  \ interface ComparisonOperator<T> {\n    boolean isMatch(final T attributeValue, final T expectedValue);\n}\n\n// Implements\
  \ exact equality comparison between values\npublic class EqualsOperator<T> implements ComparisonOperator<T> {\n    @Override\n\
  \    public boolean isMatch(final T attributeValue, final T expectedValue) {\n        return Objects.equals(attributeValue,\
  \ expectedValue);\n    }\n}\n// Implements greater than comparison for numeric values\nclass GreaterThanOperator<T extends\
  \ Number> implements ComparisonOperator<T> {\n    @Override\n    public boolean isMatch(final T attributeValue, final T\
  \ expectedValue) {\n        return Double.compare(attributeValue.doubleValue(), expectedValue.doubleValue()) > 0;\n    }\n\
  }\n// Implements less than comparison for numeric values\nclass LessThanOperator<T extends Number> implements ComparisonOperator<T>\
  \ {\n    @Override\n    public boolean isMatch(final T attributeValue, final T expectedValue) {\n        return Double.compare(attributeValue.doubleValue(),\
  \ expectedValue.doubleValue()) < 0;\n    }\n}\n// Implements regular expression pattern matching for string values\npublic\
  \ class RegexMatchOperator<T extends String> implements ComparisonOperator<T> {\n    @Override\n    public boolean isMatch(final\
  \ T attributeValue, final T expectedValue) {\n        final Pattern\np\n= Pattern.compile(expectedValue);\n        return\
  \ p.matcher(attributeValue).matches();\n    }\n}\n\n// A basic predicate that compares a file attribute with an expected\
  \ value\npublic class SimplePredicate<T> implements Predicate {\n    // The name of the file attribute to check\nprivate\
  \ final FileAttribute attributeName;\n    // The operator to use for comparison (equals, contains, greater than, etc.)\n\
  private final ComparisonOperator<T> operator;\n    // The expected value to compare against\n    T expectedValue;\n    //\
  \ Creates a new simple predicate with the specified attribute, operator, and\n// expected value\npublic SimplePredicate(\n\
  \            final FileAttribute attributeName,\n            final ComparisonOperator<T> operator,\n            final T\
  \ expectedValue) {\n        this.attributeName = attributeName;\n        this.operator = operator;\n        this.expectedValue\
  \ = expectedValue;\n    }\n    @Override\n    public boolean isMatch(final File inputFile) {\n        // Extract the actual\
  \ value of the attribute from the file\nObject\nactualValue\n= inputFile.extract(attributeName);\n        // Check if the\
  \ actual value is of the correct type\nif (expectedValue.getClass().isInstance(actualValue)) {\n            // Perform the\
  \ comparison using the specified operator\nreturn operator.isMatch((T) actualValue, expectedValue);\n        } else {\n\
  \            return false;\n        }\n    }\n}\n\npublic interface CompositePredicate\nextends Predicate {\n    // This\
  \ interface is intentionally empty as it serves as a marker\n// to identify predicates that combine multiple other predicates\
  \ (AND, OR, NOT)\n}\n// Implements logical AND operation between multiple predicates\npublic class AndPredicate\nimplements\
  \ CompositePredicate {\n    // List of predicates that must all match for this predicate to match\nprivate final List<Predicate>\
  \ operands;\n    // Creates a new AND predicate with the specified predicates\npublic AndPredicate(final List<Predicate>\
  \ operands) {\n        this.operands = operands;\n    }\n    // Checks if the given file matches ALL predicates\n@Override\n\
  \    public boolean isMatch(final File inputFile) {\n        return operands.stream().allMatch(predicate -> predicate.isMatch(inputFile));\n\
  \    }\n}\n// Implements logical OR operation between multiple predicates\npublic class OrPredicate\nimplements CompositePredicate\
  \ {\n    // List of predicates, at least one of which must match\nprivate final List<Predicate> operands;\n    // Creates\
  \ a new OR predicate with the specified predicates\npublic OrPredicate(final List<Predicate> operands) {\n        this.operands\
  \ = operands;\n    }\n    @Override\n    public boolean isMatch(final File inputFile) {\n        return operands.stream().anyMatch(predicate\
  \ -> predicate.isMatch(inputFile));\n    }\n}\n// Implements logical NOT operation on a predicate\npublic class NotPredicate\n\
  implements CompositePredicate {\n    // The predicate to negate\nprivate final Predicate operand;\n    // Creates a new\
  \ NOT predicate with the specified predicate to negate\npublic NotPredicate(final Predicate operand) {\n        this.operand\
  \ = operand;\n    }\n    @Override\n    public boolean isMatch(final File inputFile) {\n        return !operand.isMatch(inputFile);\n\
  \    }\n}\n\n// Wrapper class that encapsulates a search condition for file matching\npublic class FileSearchCriteria {\n\
  \    // The predicate that defines what makes a file match\nprivate final Predicate predicate;\n    // Constructor that\
  \ takes a predicate defining the criteria\npublic FileSearchCriteria(final Predicate predicate) {\n        this.predicate\
  \ = predicate;\n    }\n    // Checks if the given file matches the search criteria\npublic boolean isMatch(final File inputFile)\
  \ {\n        return predicate.isMatch(inputFile);\n    }\n}\n\n// Main class responsible for performing file system searches\n\
  public class FileSearch {\n    // Performs a recursive search through the file system starting from root\n// Returns a list\
  \ of files that match the given criteria\npublic List<File> search(final File root, final FileSearchCriteria criteria) {\n\
  \        // List to store matching files\nfinal List<File> result = new ArrayList<>();\n        // Stack to handle recursive\
  \ traversal without actual recursion\nfinal ArrayDeque<File> recursionStack = new ArrayDeque<>();\n        // Start with\
  \ the root directory\n        recursionStack.add(root);\n        // Continue until we've processed all files\nwhile (!recursionStack.isEmpty())\
  \ {\n            // Get the next file to process\nFile\nnext\n= recursionStack.pop();\n            // Check if the file\
  \ matches our criteria\nif (criteria.isMatch(next)) {\n                result.add(next);\n            }\n            //\
  \ Add all directory entries to the stack for processing\nfor (File entry : next.getEntries()) {\n                recursionStack.push(entry);\n\
  \            }\n        }\n        return result;\n    }\n}\n\npublic class FileSearchTest {\n    @Test\npublic void testFileSearch()\
  \ {\n        // Create a root directory and two files with different owners\nfinal File\nroot\n=\nnew File(true, 0, \"adam\"\
  , \"root\");\n        final File\na\n=\nnew File(false, 2000, \"adam\", \"a\");\n        final File\nb\n=\nnew File(false,\
  \ 3000, \"george\", \"b\");\n        // Add files to the root directory\n        root.addEntry(a);\n        root.addEntry(b);\n\
  \        // Search criteria: Find non-directory files owned by users matching \"ge.*\"\nfinal FileSearchCriteria\ncriteria\n\
  =\nnew FileSearchCriteria(\n                        new AndPredicate(\n                                List.of(\n      \
  \                                  new SimplePredicate<>(\n                                                FileAttribute.IS_DIRECTORY,\n\
  \                                                new EqualsOperator<>(),\n                                             \
  \   false),\n                                        new SimplePredicate<>(\n                                          \
  \      FileAttribute.OWNER,\n                                                new RegexMatchOperator<>(),\n             \
  \                                   \"ge.*\"))));\n        // Execute the search and get results\nfinal FileSearch\nfileSearch\n\
  =\nnew FileSearch();\n        final List<File> result = fileSearch.search(root, criteria);\n        // Verify that only\
  \ one file matches the criteria\n        assertEquals(1, result.size());\n        // Verify that the matching file is \"\
  b\"\n        assertEquals(\"b\", result.get(0).getFilename());\n    }\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Unix File Search Command (find)


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Specification / Filter Pattern (Search Predicates), Composite Pattern (Files and Directories)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
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
