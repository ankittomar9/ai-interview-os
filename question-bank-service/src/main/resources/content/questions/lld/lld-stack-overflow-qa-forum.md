---
slug: lld-stack-overflow-qa-forum
title: "StackOverflow Style Q&A Discussion Platform"
track: SPRING_LLD
difficulty: EASY
topics:
  - lld
est_minutes: 35
tags: ['object-oriented-design', 'forum', 'reputation', 'voting']
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
        <groupId>com.interviewos.forum</groupId>
        <artifactId>qa-forum</artifactId>
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
    # StackOverflow Style Q&A Discussion Platform

    ## Overview
    Design a collaborative Q&A forum supporting question posting, answers, voting (upvote/downvote), tag classification, and user reputation points.
  src/main/java/com/interviewos/forum/DiscussionForum.java: |
    package com.interviewos.forum;

    import java.util.List;

    public interface DiscussionForum {
        String postQuestion(String userId, String title, String body, List<String> tags);
        String postAnswer(String userId, String questionId, String body);
        void voteQuestion(String userId, String questionId, int voteDelta);
        int getVoteCount(String questionId);
    }
  src/main/java/com/interviewos/forum/impl/DiscussionForumImpl.java: |
    package com.interviewos.forum;

    import java.util.*;
    import java.util.concurrent.ConcurrentHashMap;
    import java.util.concurrent.atomic.AtomicInteger;

    public class InMemoryDiscussionForum implements DiscussionForum {

        private final Map<String, Question> questions = new ConcurrentHashMap<>();
        private final AtomicInteger seq = new AtomicInteger();

        private static class Question {
            String id;
            String userId;
            String title;
            String body;
            List<String> tags;
            int votes = 0;
            List<String> answerIds = new ArrayList<>();

            Question(String id, String userId, String title, String body, List<String> tags) {
                this.id = id;
                this.userId = userId;
                this.title = title;
                this.body = body;
                this.tags = tags;
            }
        }

        @Override
        public String postQuestion(String userId, String title, String body, List<String> tags) {
            String qId = "Q-" + seq.incrementAndGet();
            questions.put(qId, new Question(qId, userId, title, body, tags));
            return qId;
        }

        @Override
        public String postAnswer(String userId, String questionId, String body) {
            Question q = questions.get(questionId);
            if (q == null) throw new IllegalArgumentException("Question not found");
            String aId = "A-" + seq.incrementAndGet();
            synchronized (q) {
                q.answerIds.add(aId);
            }
            return aId;
        }

        @Override
        public void voteQuestion(String userId, String questionId, int voteDelta) {
            Question q = questions.get(questionId);
            if (q != null) {
                synchronized (q) {
                    q.votes += voteDelta;
                }
            }
        }

        @Override
        public int getVoteCount(String questionId) {
            Question q = questions.get(questionId);
            return q != null ? q.votes : 0;
        }
    }
starterCode: |
  package com.interviewos.forum;

  import java.util.List;

  public interface DiscussionForum {
      String postQuestion(String userId, String title, String body, List<String> tags);
      String postAnswer(String userId, String questionId, String body);
      void voteQuestion(String userId, String questionId, int voteDelta);
      int getVoteCount(String questionId);
  }
solutionCode: |
  package com.interviewos.forum;

  import java.util.*;
  import java.util.concurrent.ConcurrentHashMap;
  import java.util.concurrent.atomic.AtomicInteger;

  public class InMemoryDiscussionForum implements DiscussionForum {

      private final Map<String, Question> questions = new ConcurrentHashMap<>();
      private final AtomicInteger seq = new AtomicInteger();

      private static class Question {
          String id;
          String userId;
          String title;
          String body;
          List<String> tags;
          int votes = 0;
          List<String> answerIds = new ArrayList<>();

          Question(String id, String userId, String title, String body, List<String> tags) {
              this.id = id;
              this.userId = userId;
              this.title = title;
              this.body = body;
              this.tags = tags;
          }
      }

      @Override
      public String postQuestion(String userId, String title, String body, List<String> tags) {
          String qId = "Q-" + seq.incrementAndGet();
          questions.put(qId, new Question(qId, userId, title, body, tags));
          return qId;
      }

      @Override
      public String postAnswer(String userId, String questionId, String body) {
          Question q = questions.get(questionId);
          if (q == null) throw new IllegalArgumentException("Question not found");
          String aId = "A-" + seq.incrementAndGet();
          synchronized (q) {
              q.answerIds.add(aId);
          }
          return aId;
      }

      @Override
      public void voteQuestion(String userId, String questionId, int voteDelta) {
          Question q = questions.get(questionId);
          if (q != null) {
              synchronized (q) {
                  q.votes += voteDelta;
              }
          }
      }

      @Override
      public int getVoteCount(String questionId) {
          Question q = questions.get(questionId);
          return q != null ? q.votes : 0;
      }
  }
editablePaths:
  - "src/main/java/**"
hiddenTestFiles:
  src/test/java/com/interviewos/forum/DiscussionForumTest.java: |
    package com.interviewos.forum;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import java.util.List;
    import static org.junit.jupiter.api.Assertions.*;

    public class DiscussionForumTest {

        @Test
        @DisplayName("Post question, answer, and upvote")
        void testForumWorkflow() {
            DiscussionForum forum = new InMemoryDiscussionForum();
            String qId = forum.postQuestion("user1", "What is Dependency Injection?", "Can someone explain DI?", List.of("java", "spring"));
            assertNotNull(qId);

            String aId = forum.postAnswer("user2", qId, "DI is a design pattern...");
            assertNotNull(aId);

            forum.voteQuestion("user3", qId, 1);
            forum.voteQuestion("user4", qId, 1);
            assertEquals(2, forum.getVoteCount(qId));
        }
    }
referenceSolutions:
  - approachId: canonical-lld-stack-overflow-qa-forum
    label: "Primary — StackOverflow Style Q&A Discussion Platform"
    approachClass: PRIMARY
    kind: CODE
    summary: "Design a collaborative Q&A forum supporting question posting, answers, voting (upvote/downvote), tag classification, and user reputation points."
    keyIdea: "Modular object-oriented architecture satisfying all test invariants."
    timeComplexity: "O(1)"
    spaceComplexity: "O(N)"
    code: |
      package com.interviewos.forum;

      import java.util.*;
      import java.util.concurrent.ConcurrentHashMap;
      import java.util.concurrent.atomic.AtomicInteger;

      public class InMemoryDiscussionForum implements DiscussionForum {

          private final Map<String, Question> questions = new ConcurrentHashMap<>();
          private final AtomicInteger seq = new AtomicInteger();

          private static class Question {
              String id;
              String userId;
              String title;
              String body;
              List<String> tags;
              int votes = 0;
              List<String> answerIds = new ArrayList<>();

              Question(String id, String userId, String title, String body, List<String> tags) {
                  this.id = id;
                  this.userId = userId;
                  this.title = title;
                  this.body = body;
                  this.tags = tags;
              }
          }

          @Override
          public String postQuestion(String userId, String title, String body, List<String> tags) {
              String qId = "Q-" + seq.incrementAndGet();
              questions.put(qId, new Question(qId, userId, title, body, tags));
              return qId;
          }

          @Override
          public String postAnswer(String userId, String questionId, String body) {
              Question q = questions.get(questionId);
              if (q == null) throw new IllegalArgumentException("Question not found");
              String aId = "A-" + seq.incrementAndGet();
              synchronized (q) {
                  q.answerIds.add(aId);
              }
              return aId;
          }

          @Override
          public void voteQuestion(String userId, String questionId, int voteDelta) {
              Question q = questions.get(questionId);
              if (q != null) {
                  synchronized (q) {
                      q.votes += voteDelta;
                  }
              }
          }

          @Override
          public int getVoteCount(String questionId) {
              Question q = questions.get(questionId);
              return q != null ? q.votes : 0;
          }
      }
    tradeoffs:
      - "In-memory synchronization guarantees safety under concurrent multi-threaded execution"
      - "Clean domain abstractions allow pluggable extensions without modifying core controllers"
---

### Problem Scope: StackOverflow Style Q&A Discussion Platform

Design a collaborative Q&A forum supporting question posting, answers, voting (upvote/downvote), tag classification, and user reputation points.

#### Functional Requirements:
1. **Core Domain Model**: Implement the classes and interfaces defining StackOverflow Style Q&A Discussion Platform.
2. **Design Patterns**: Employ appropriate object-oriented patterns (Strategy, Factory, State, Composite, Observer) to decouple concerns.
3. **Thread Safety**: Ensure all shared state operations are thread-safe and free from race conditions.
4. **Unit Verification**: Pass all JUnit Jupiter test suites under `src/test/java/`.

#### Non-Functional Requirements:
1. **Extensibility**: Support straightforward extension of new behaviors without modifying existing classes.
2. **Code Cleanliness**: Follow standard Java naming conventions and clean code practices.
