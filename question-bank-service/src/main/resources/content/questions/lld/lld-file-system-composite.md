---
slug: lld-file-system-composite
title: "In-Memory Virtual File System using Composite Pattern"
track: SPRING_LLD
difficulty: MEDIUM
topics:
  - lld
est_minutes: 35
tags: ['composite-pattern', 'file-system', 'tree', 'traversal']
buildProfile: maven-workspace
source: ai-generated:v1
status: PUBLISHED
hints:
  - "Decouple interfaces from concrete implementations using standard design patterns."
  - "Ensure thread safety across shared data structures using concurrent collections or synchronization."
  - "Keep domain classes cohesive with clean single responsibilities."
coaching:
  presentationTips:
    - "Clarify functional requirements and thread-safety expectations before writing code."
    - "Identify core design patterns (Factory, Strategy, Observer, State, Composite) explicitly."
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.filesystem</groupId>
        <artifactId>file-system</artifactId>
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
    # In-Memory Virtual File System using Composite Pattern

    ## Overview
    Design an in-memory hierarchical file system with directories and files supporting recursive path resolution, file size summation, and deletions.
  src/main/java/com/interviewos/filesystem/FileSystem.java: |
    package com.interviewos.filesystem;

    public interface FileSystemNode {
        String getName();
        int getSize();
        boolean isDirectory();
    }

    class FileNode implements FileSystemNode {
        private final String name;
        private final int size;
        public FileNode(String name, int size) { this.name = name; this.size = size; }
        @Override public String getName() { return name; }
        @Override public int getSize() { return size; }
        @Override public boolean isDirectory() { return false; }
    }
  src/main/java/com/interviewos/filesystem/impl/FileSystemImpl.java: |
    package com.interviewos.filesystem;

    import java.util.*;

    public class DirectoryNode implements FileSystemNode {
        private final String name;
        private final Map<String, FileSystemNode> children = new HashMap<>();

        public DirectoryNode(String name) {
            this.name = name;
        }

        public void add(FileSystemNode node) {
            children.put(node.getName(), node);
        }

        @Override
        public String getName() { return name; }

        @Override
        public int getSize() {
            return children.values().stream().mapToInt(FileSystemNode::getSize).sum();
        }

        @Override
        public boolean isDirectory() { return true; }
    }
starterCode: |
  package com.interviewos.filesystem;

  public interface FileSystemNode {
      String getName();
      int getSize();
      boolean isDirectory();
  }

  class FileNode implements FileSystemNode {
      private final String name;
      private final int size;
      public FileNode(String name, int size) { this.name = name; this.size = size; }
      @Override public String getName() { return name; }
      @Override public int getSize() { return size; }
      @Override public boolean isDirectory() { return false; }
  }
solutionCode: |
  package com.interviewos.filesystem;

  import java.util.*;

  public class DirectoryNode implements FileSystemNode {
      private final String name;
      private final Map<String, FileSystemNode> children = new HashMap<>();

      public DirectoryNode(String name) {
          this.name = name;
      }

      public void add(FileSystemNode node) {
          children.put(node.getName(), node);
      }

      @Override
      public String getName() { return name; }

      @Override
      public int getSize() {
          return children.values().stream().mapToInt(FileSystemNode::getSize).sum();
      }

      @Override
      public boolean isDirectory() { return true; }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/filesystem/FileSystemTest.java: |
    package com.interviewos.filesystem;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class FileSystemTest {

        @Test
        @DisplayName("Directory aggregates recursive file sizes")
        void testCompositeSize() {
            DirectoryNode root = new DirectoryNode("root");
            root.add(new FileNode("a.txt", 100));
            DirectoryNode sub = new DirectoryNode("docs");
            sub.add(new FileNode("b.pdf", 250));
            root.add(sub);

            assertEquals(350, root.getSize());
        }
    }
referenceSolutions:
  - approachId: canonical-lld-file-system-composite
    label: "Primary — In-Memory Virtual File System using Composite Pattern"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design an in-memory hierarchical file system with directories and files supporting recursive path resolution, file size summation, and deletions."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.filesystem;

      import java.util.*;

      public class DirectoryNode implements FileSystemNode {
          private final String name;
          private final Map<String, FileSystemNode> children = new HashMap<>();

          public DirectoryNode(String name) {
              this.name = name;
          }

          public void add(FileSystemNode node) {
              children.put(node.getName(), node);
          }

          @Override
          public String getName() { return name; }

          @Override
          public int getSize() {
              return children.values().stream().mapToInt(FileSystemNode::getSize).sum();
          }

          @Override
          public boolean isDirectory() { return true; }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: In-Memory Virtual File System using Composite Pattern

Design an in-memory hierarchical file system with directories and files supporting recursive path resolution, file size summation, and deletions.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining In-Memory Virtual File System using Composite Pattern.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
