---
slug: lld-task-management
title: Task Management System
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
- command-pattern
- state-pattern
- observer-pattern
- task-management
buildProfile: maven-workspace
source: inspired-by:takeuforward-prep-hub/lld/task-management
status: PUBLISHED
hints:
- Decouple state transition recording from notification logic using the Observer pattern.
- Use thread-safe collections like ConcurrentHashMap and CopyOnWriteArrayList for task and history tracking.
- Encapsulate multi-attribute query criteria into a TaskFilter specification object.
coaching:
  presentationTips:
  - Explain the role of immutable history entries in building an auditable change log.
  - Discuss how the Observer pattern prevents tight coupling between the TaskService and notification sinks.
  - Detail how concurrent reads and writes are managed safely without broad coarse locks.
  commonMistakes:
  - Mutating task status without capturing a corresponding historical audit entry.
  - Throwing ConcurrentModificationException when notifying observers during active subscription changes.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>task-management</artifactId>
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
                    <artifactId>maven-surefire-plugin</artifactId>
                    <version>3.5.2</version>
                </plugin>
            </plugins>
        </build>
    </project>
  README.md: |
    # Task Management System

    ## Overview
    Implement an extensible, object-oriented Task Management system supporting task creation, lifecycle state transitions, priority tagging, assignment, query filtering, and event observation.

    ## Key Components
    - `com.interviewos.tasks.service.TaskService`: Manages task storage, state machine updates, and audit history.
    - `com.interviewos.tasks.service.TaskManager`: Event-driven facade coordinating operations and notifying observers.
    - `com.interviewos.tasks.observer.TaskObserver`: Observer interface receiving event notifications upon task changes.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/tasks/service/TaskService.java`
    2. `src/main/java/com/interviewos/tasks/service/TaskManager.java`
  src/main/java/com/interviewos/tasks/model/TaskStatus.java: |
    package com.interviewos.tasks.model;

    public enum TaskStatus {
        CREATED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }
  src/main/java/com/interviewos/tasks/model/TaskPriority.java: |
    package com.interviewos.tasks.model;

    public enum TaskPriority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
  src/main/java/com/interviewos/tasks/model/Task.java: |
    package com.interviewos.tasks.model;

    import java.time.Instant;

    public class Task {
        private final String taskId;
        private volatile String title;
        private volatile String description;
        private volatile TaskPriority priority;
        private volatile TaskStatus status;
        private volatile String assignee;
        private final Instant createdAt;

        public Task(String taskId, String title, String description, TaskPriority priority, String assignee) {
            this(taskId, title, description, priority, assignee, Instant.now());
        }

        public Task(String taskId, String title, String description, TaskPriority priority, String assignee, Instant createdAt) {
            this.taskId = taskId;
            this.title = title;
            this.description = description;
            this.priority = priority != null ? priority : TaskPriority.MEDIUM;
            this.status = TaskStatus.CREATED;
            this.assignee = assignee;
            this.createdAt = createdAt != null ? createdAt : Instant.now();
        }

        public String getTaskId() { return taskId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public TaskPriority getPriority() { return priority; }
        public void setPriority(TaskPriority priority) { this.priority = priority; }
        public TaskStatus getStatus() { return status; }
        public void setStatus(TaskStatus status) { this.status = status; }
        public String getAssignee() { return assignee; }
        public void setAssignee(String assignee) { this.assignee = assignee; }
        public Instant getCreatedAt() { return createdAt; }
    }
  src/main/java/com/interviewos/tasks/model/TaskHistoryEntry.java: |
    package com.interviewos.tasks.model;

    import java.time.Instant;

    public class TaskHistoryEntry {
        private final String taskId;
        private final TaskStatus fromStatus;
        private final TaskStatus toStatus;
        private final Instant timestamp;
        private final String changedBy;

        public TaskHistoryEntry(String taskId, TaskStatus fromStatus, TaskStatus toStatus, String changedBy) {
            this.taskId = taskId;
            this.fromStatus = fromStatus;
            this.toStatus = toStatus;
            this.timestamp = Instant.now();
            this.changedBy = changedBy;
        }

        public String getTaskId() { return taskId; }
        public TaskStatus getFromStatus() { return fromStatus; }
        public TaskStatus getToStatus() { return toStatus; }
        public Instant getTimestamp() { return timestamp; }
        public String getChangedBy() { return changedBy; }
    }
  src/main/java/com/interviewos/tasks/observer/TaskObserver.java: |
    package com.interviewos.tasks.observer;

    import com.interviewos.tasks.model.Task;
    import com.interviewos.tasks.model.TaskStatus;

    public interface TaskObserver {
        void onTaskCreated(Task task);
        void onTaskStatusChanged(Task task, TaskStatus oldStatus, TaskStatus newStatus);
    }
  src/main/java/com/interviewos/tasks/filter/TaskFilter.java: |
    package com.interviewos.tasks.filter;

    import com.interviewos.tasks.model.Task;
    import com.interviewos.tasks.model.TaskPriority;
    import com.interviewos.tasks.model.TaskStatus;

    public class TaskFilter {
        private final TaskStatus status;
        private final TaskPriority priority;
        private final String assignee;

        public TaskFilter(TaskStatus status, TaskPriority priority, String assignee) {
            this.status = status;
            this.priority = priority;
            this.assignee = assignee;
        }

        public boolean matches(Task task) {
            if (task == null) return false;
            if (status != null && task.getStatus() != status) return false;
            if (priority != null && task.getPriority() != priority) return false;
            if (assignee != null && !assignee.equalsIgnoreCase(task.getAssignee())) return false;
            return true;
        }
    }
  src/main/java/com/interviewos/tasks/service/TaskService.java: |
    package com.interviewos.tasks.service;

    import com.interviewos.tasks.filter.TaskFilter;
    import com.interviewos.tasks.model.Task;
    import com.interviewos.tasks.model.TaskHistoryEntry;
    import com.interviewos.tasks.model.TaskPriority;
    import com.interviewos.tasks.model.TaskStatus;

    import java.util.ArrayList;
    import java.util.List;
    import java.util.Map;
    import java.util.UUID;
    import java.util.concurrent.ConcurrentHashMap;
    import java.util.concurrent.CopyOnWriteArrayList;

    public class TaskService {
        private final Map<String, Task> tasks = new ConcurrentHashMap<>();
        private final Map<String, List<TaskHistoryEntry>> history = new ConcurrentHashMap<>();

        public Task createTask(String title, String description, TaskPriority priority, String assignee) {
            // TODO: Generate unique ID, instantiate Task, store in map, return instance
            throw new UnsupportedOperationException("TODO: Implement TaskService.createTask");
        }

        public synchronized boolean updateTaskStatus(String taskId, TaskStatus newStatus, String changedBy) {
            // TODO: Validate transition, update task status, record history entry
            throw new UnsupportedOperationException("TODO: Implement TaskService.updateTaskStatus");
        }

        public synchronized boolean assignTask(String taskId, String newAssignee) {
            // TODO: Update assignee for task if it exists
            throw new UnsupportedOperationException("TODO: Implement TaskService.assignTask");
        }

        public Task getTask(String taskId) {
            return tasks.get(taskId);
        }

        public List<Task> filterTasks(TaskFilter filter) {
            // TODO: Return tasks matching filter criteria
            throw new UnsupportedOperationException("TODO: Implement TaskService.filterTasks");
        }

        public List<TaskHistoryEntry> getTaskHistory(String taskId) {
            return history.getOrDefault(taskId, List.of());
        }
    }
  src/main/java/com/interviewos/tasks/service/TaskManager.java: |
    package com.interviewos.tasks.service;

    import com.interviewos.tasks.model.Task;
    import com.interviewos.tasks.model.TaskPriority;
    import com.interviewos.tasks.model.TaskStatus;
    import com.interviewos.tasks.observer.TaskObserver;

    import java.util.List;
    import java.util.concurrent.CopyOnWriteArrayList;

    public class TaskManager {
        private final TaskService taskService;
        private final List<TaskObserver> observers = new CopyOnWriteArrayList<>();

        public TaskManager() {
            this(new TaskService());
        }

        public TaskManager(TaskService taskService) {
            this.taskService = taskService != null ? taskService : new TaskService();
        }

        public TaskService getTaskService() {
            return taskService;
        }

        public void addObserver(TaskObserver observer) {
            if (observer != null) {
                observers.add(observer);
            }
        }

        public void removeObserver(TaskObserver observer) {
            observers.remove(observer);
        }

        public Task createAndNotify(String title, String description, TaskPriority priority, String assignee) {
            // TODO: Delegate to taskService.createTask and notify observers
            throw new UnsupportedOperationException("TODO: Implement TaskManager.createAndNotify");
        }

        public boolean transitionAndNotify(String taskId, TaskStatus newStatus, String changedBy) {
            // TODO: Query old status, update via taskService, and notify observers
            throw new UnsupportedOperationException("TODO: Implement TaskManager.transitionAndNotify");
        }
    }
  src/test/java/com/interviewos/tasks/TaskCreationAssignmentTest.java: |
    package com.interviewos.tasks;

    import com.interviewos.tasks.model.Task;
    import com.interviewos.tasks.model.TaskPriority;
    import com.interviewos.tasks.model.TaskStatus;
    import com.interviewos.tasks.service.TaskService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class TaskCreationAssignmentTest {

        @Test
        @DisplayName("createTask initializes task with unique id and CREATED status")
        void testTaskCreationInitialState() {
            TaskService service = new TaskService();
            Task task = service.createTask("API Auth", "Build JWT auth", TaskPriority.HIGH, "alice");

            assertNotNull(task);
            assertNotNull(task.getTaskId());
            assertEquals(TaskStatus.CREATED, task.getStatus());
            assertEquals("alice", task.getAssignee());
        }

        @Test
        @DisplayName("assignTask modifies current assignee")
        void testTaskReassignment() {
            TaskService service = new TaskService();
            Task task = service.createTask("Bugfix", "Fix crash", TaskPriority.CRITICAL, "alice");
            boolean updated = service.assignTask(task.getTaskId(), "bob");

            assertTrue(updated);
            assertEquals("bob", service.getTask(task.getTaskId()).getAssignee());
        }
    }
  src/test/java/com/interviewos/tasks/TaskStateLifecycleTest.java: |
    package com.interviewos.tasks;

    import com.interviewos.tasks.model.Task;
    import com.interviewos.tasks.model.TaskHistoryEntry;
    import com.interviewos.tasks.model.TaskPriority;
    import com.interviewos.tasks.model.TaskStatus;
    import com.interviewos.tasks.service.TaskService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class TaskStateLifecycleTest {

        @Test
        @DisplayName("updateTaskStatus advances task state and registers history")
        void testStateProgressionWithAudit() {
            TaskService service = new TaskService();
            Task task = service.createTask("Migration", "DB flyway", TaskPriority.MEDIUM, "charlie");

            boolean movedToProgress = service.updateTaskStatus(task.getTaskId(), TaskStatus.IN_PROGRESS, "charlie");
            assertTrue(movedToProgress);
            assertEquals(TaskStatus.IN_PROGRESS, task.getStatus());

            boolean movedToDone = service.updateTaskStatus(task.getTaskId(), TaskStatus.COMPLETED, "qa-bot");
            assertTrue(movedToDone);
            assertEquals(TaskStatus.COMPLETED, task.getStatus());

            List<TaskHistoryEntry> history = service.getTaskHistory(task.getTaskId());
            assertEquals(2, history.size());
            assertEquals(TaskStatus.CREATED, history.get(0).getFromStatus());
            assertEquals(TaskStatus.IN_PROGRESS, history.get(0).getToStatus());
            assertEquals(TaskStatus.IN_PROGRESS, history.get(1).getFromStatus());
            assertEquals(TaskStatus.COMPLETED, history.get(1).getToStatus());
        }

        @Test
        @DisplayName("updateTaskStatus returns false for non-existent task")
        void testNonExistentTaskTransition() {
            TaskService service = new TaskService();
            assertFalse(service.updateTaskStatus("UNKNOWN-123", TaskStatus.COMPLETED, "admin"));
        }
    }
  src/test/java/com/interviewos/tasks/TaskFilteringSearchTest.java: |
    package com.interviewos.tasks;

    import com.interviewos.tasks.filter.TaskFilter;
    import com.interviewos.tasks.model.Task;
    import com.interviewos.tasks.model.TaskPriority;
    import com.interviewos.tasks.model.TaskStatus;
    import com.interviewos.tasks.observer.TaskObserver;
    import com.interviewos.tasks.service.TaskManager;
    import com.interviewos.tasks.service.TaskService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.ArrayList;
    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class TaskFilteringSearchTest {

        @Test
        @DisplayName("filterTasks filters correctly by assignee and priority")
        void testFilterByAssigneeAndPriority() {
            TaskService service = new TaskService();
            service.createTask("T1", "D1", TaskPriority.HIGH, "dev1");
            service.createTask("T2", "D2", TaskPriority.LOW, "dev1");
            service.createTask("T3", "D3", TaskPriority.HIGH, "dev2");

            TaskFilter filter = new TaskFilter(null, TaskPriority.HIGH, "dev1");
            List<Task> results = service.filterTasks(filter);

            assertEquals(1, results.size());
            assertEquals("T1", results.get(0).getTitle());
        }

        @Test
        @DisplayName("TaskManager publishes events to registered observers")
        void testObserverNotifications() {
            TaskManager manager = new TaskManager();
            List<String> createdEvents = new ArrayList<>();
            List<String> statusEvents = new ArrayList<>();

            manager.addObserver(new TaskObserver() {
                @Override
                public void onTaskCreated(Task task) {
                    createdEvents.add(task.getTaskId());
                }

                @Override
                public void onTaskStatusChanged(Task task, TaskStatus oldStatus, TaskStatus newStatus) {
                    statusEvents.add(oldStatus + "->" + newStatus);
                }
            });

            Task t = manager.createAndNotify("Doc", "Write specs", TaskPriority.MEDIUM, "writer");
            manager.transitionAndNotify(t.getTaskId(), TaskStatus.IN_PROGRESS, "writer");

            assertEquals(1, createdEvents.size());
            assertEquals(1, statusEvents.size());
            assertEquals("CREATED->IN_PROGRESS", statusEvents.get(0));
        }
    }
editablePaths:
- src/main/java/com/interviewos/tasks/service/TaskService.java
- src/main/java/com/interviewos/tasks/service/TaskManager.java
hiddenTestFiles:
  src/test/java/com/interviewos/tasks/TaskCreationAssignmentTest.java: |
    package com.interviewos.tasks;

    import com.interviewos.tasks.model.Task;
    import com.interviewos.tasks.model.TaskPriority;
    import com.interviewos.tasks.model.TaskStatus;
    import com.interviewos.tasks.service.TaskService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class TaskCreationAssignmentTest {

        @Test
        @DisplayName("createTask initializes task with unique id and CREATED status")
        void testTaskCreationInitialState() {
            TaskService service = new TaskService();
            Task task = service.createTask("API Auth", "Build JWT auth", TaskPriority.HIGH, "alice");

            assertNotNull(task);
            assertNotNull(task.getTaskId());
            assertEquals(TaskStatus.CREATED, task.getStatus());
            assertEquals("alice", task.getAssignee());
        }

        @Test
        @DisplayName("assignTask modifies current assignee")
        void testTaskReassignment() {
            TaskService service = new TaskService();
            Task task = service.createTask("Bugfix", "Fix crash", TaskPriority.CRITICAL, "alice");
            boolean updated = service.assignTask(task.getTaskId(), "bob");

            assertTrue(updated);
            assertEquals("bob", service.getTask(task.getTaskId()).getAssignee());
        }
    }
  src/test/java/com/interviewos/tasks/TaskStateLifecycleTest.java: |
    package com.interviewos.tasks;

    import com.interviewos.tasks.model.Task;
    import com.interviewos.tasks.model.TaskHistoryEntry;
    import com.interviewos.tasks.model.TaskPriority;
    import com.interviewos.tasks.model.TaskStatus;
    import com.interviewos.tasks.service.TaskService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class TaskStateLifecycleTest {

        @Test
        @DisplayName("updateTaskStatus advances task state and registers history")
        void testStateProgressionWithAudit() {
            TaskService service = new TaskService();
            Task task = service.createTask("Migration", "DB flyway", TaskPriority.MEDIUM, "charlie");

            boolean movedToProgress = service.updateTaskStatus(task.getTaskId(), TaskStatus.IN_PROGRESS, "charlie");
            assertTrue(movedToProgress);
            assertEquals(TaskStatus.IN_PROGRESS, task.getStatus());

            boolean movedToDone = service.updateTaskStatus(task.getTaskId(), TaskStatus.COMPLETED, "qa-bot");
            assertTrue(movedToDone);
            assertEquals(TaskStatus.COMPLETED, task.getStatus());

            List<TaskHistoryEntry> history = service.getTaskHistory(task.getTaskId());
            assertEquals(2, history.size());
            assertEquals(TaskStatus.CREATED, history.get(0).getFromStatus());
            assertEquals(TaskStatus.IN_PROGRESS, history.get(0).getToStatus());
            assertEquals(TaskStatus.IN_PROGRESS, history.get(1).getFromStatus());
            assertEquals(TaskStatus.COMPLETED, history.get(1).getToStatus());
        }

        @Test
        @DisplayName("updateTaskStatus returns false for non-existent task")
        void testNonExistentTaskTransition() {
            TaskService service = new TaskService();
            assertFalse(service.updateTaskStatus("UNKNOWN-123", TaskStatus.COMPLETED, "admin"));
        }
    }
  src/test/java/com/interviewos/tasks/TaskFilteringSearchTest.java: |
    package com.interviewos.tasks;

    import com.interviewos.tasks.filter.TaskFilter;
    import com.interviewos.tasks.model.Task;
    import com.interviewos.tasks.model.TaskPriority;
    import com.interviewos.tasks.model.TaskStatus;
    import com.interviewos.tasks.observer.TaskObserver;
    import com.interviewos.tasks.service.TaskManager;
    import com.interviewos.tasks.service.TaskService;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.ArrayList;
    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class TaskFilteringSearchTest {

        @Test
        @DisplayName("filterTasks filters correctly by assignee and priority")
        void testFilterByAssigneeAndPriority() {
            TaskService service = new TaskService();
            service.createTask("T1", "D1", TaskPriority.HIGH, "dev1");
            service.createTask("T2", "D2", TaskPriority.LOW, "dev1");
            service.createTask("T3", "D3", TaskPriority.HIGH, "dev2");

            TaskFilter filter = new TaskFilter(null, TaskPriority.HIGH, "dev1");
            List<Task> results = service.filterTasks(filter);

            assertEquals(1, results.size());
            assertEquals("T1", results.get(0).getTitle());
        }

        @Test
        @DisplayName("TaskManager publishes events to registered observers")
        void testObserverNotifications() {
            TaskManager manager = new TaskManager();
            List<String> createdEvents = new ArrayList<>();
            List<String> statusEvents = new ArrayList<>();

            manager.addObserver(new TaskObserver() {
                @Override
                public void onTaskCreated(Task task) {
                    createdEvents.add(task.getTaskId());
                }

                @Override
                public void onTaskStatusChanged(Task task, TaskStatus oldStatus, TaskStatus newStatus) {
                    statusEvents.add(oldStatus + "->" + newStatus);
                }
            });

            Task t = manager.createAndNotify("Doc", "Write specs", TaskPriority.MEDIUM, "writer");
            manager.transitionAndNotify(t.getTaskId(), TaskStatus.IN_PROGRESS, "writer");

            assertEquals(1, createdEvents.size());
            assertEquals(1, statusEvents.size());
            assertEquals("CREATED->IN_PROGRESS", statusEvents.get(0));
        }
    }
starterCode: |
  package com.interviewos.tasks.service;

  import com.interviewos.tasks.filter.TaskFilter;
  import com.interviewos.tasks.model.Task;
  import com.interviewos.tasks.model.TaskHistoryEntry;
  import com.interviewos.tasks.model.TaskPriority;
  import com.interviewos.tasks.model.TaskStatus;

  import java.util.ArrayList;
  import java.util.List;
  import java.util.Map;
  import java.util.UUID;
  import java.util.concurrent.ConcurrentHashMap;
  import java.util.concurrent.CopyOnWriteArrayList;

  public class TaskService {
      private final Map<String, Task> tasks = new ConcurrentHashMap<>();
      private final Map<String, List<TaskHistoryEntry>> history = new ConcurrentHashMap<>();

      public Task createTask(String title, String description, TaskPriority priority, String assignee) {
          // TODO: Generate unique ID, instantiate Task, store in map, return instance
          throw new UnsupportedOperationException("TODO: Implement TaskService.createTask");
      }

      public synchronized boolean updateTaskStatus(String taskId, TaskStatus newStatus, String changedBy) {
          // TODO: Validate transition, update task status, record history entry
          throw new UnsupportedOperationException("TODO: Implement TaskService.updateTaskStatus");
      }

      public synchronized boolean assignTask(String taskId, String newAssignee) {
          // TODO: Update assignee for task if it exists
          throw new UnsupportedOperationException("TODO: Implement TaskService.assignTask");
      }

      public Task getTask(String taskId) {
          return tasks.get(taskId);
      }

      public List<Task> filterTasks(TaskFilter filter) {
          // TODO: Return tasks matching filter criteria
          throw new UnsupportedOperationException("TODO: Implement TaskService.filterTasks");
      }

      public List<TaskHistoryEntry> getTaskHistory(String taskId) {
          return history.getOrDefault(taskId, List.of());
      }
  }
solutionCode: |
  package com.interviewos.tasks.service;

  import com.interviewos.tasks.filter.TaskFilter;
  import com.interviewos.tasks.model.Task;
  import com.interviewos.tasks.model.TaskHistoryEntry;
  import com.interviewos.tasks.model.TaskPriority;
  import com.interviewos.tasks.model.TaskStatus;

  import java.util.ArrayList;
  import java.util.List;
  import java.util.Map;
  import java.util.UUID;
  import java.util.concurrent.ConcurrentHashMap;
  import java.util.concurrent.CopyOnWriteArrayList;

  public class TaskService {
      private final Map<String, Task> tasks = new ConcurrentHashMap<>();
      private final Map<String, List<TaskHistoryEntry>> history = new ConcurrentHashMap<>();

      public Task createTask(String title, String description, TaskPriority priority, String assignee) {
          String id = "TASK-" + UUID.randomUUID().toString().substring(0, 8);
          Task task = new Task(id, title, description, priority, assignee);
          tasks.put(id, task);
          history.put(id, new CopyOnWriteArrayList<>());
          return task;
      }

      public synchronized boolean updateTaskStatus(String taskId, TaskStatus newStatus, String changedBy) {
          Task task = tasks.get(taskId);
          if (task == null || newStatus == null) return false;
          TaskStatus old = task.getStatus();
          task.setStatus(newStatus);
          List<TaskHistoryEntry> entries = history.computeIfAbsent(taskId, k -> new CopyOnWriteArrayList<>());
          entries.add(new TaskHistoryEntry(taskId, old, newStatus, changedBy));
          return true;
      }

      public synchronized boolean assignTask(String taskId, String newAssignee) {
          Task task = tasks.get(taskId);
          if (task == null) return false;
          task.setAssignee(newAssignee);
          return true;
      }

      public Task getTask(String taskId) {
          return tasks.get(taskId);
      }

      public List<Task> filterTasks(TaskFilter filter) {
          List<Task> out = new ArrayList<>();
          for (Task t : tasks.values()) {
              if (filter == null || filter.matches(t)) {
                  out.add(t);
              }
          }
          return out;
      }

      public List<TaskHistoryEntry> getTaskHistory(String taskId) {
          return history.getOrDefault(taskId, List.of());
      }
  }
---

### Problem Statement: Task Management System

You are tasked with designing and implementing an object-oriented Task Management and Issue Tracking system in Java. Engineering organizations require structured, transparent workflows to coordinate feature delivery, bug triages, and team assignments. Your goal is to construct a modular domain model that enforces valid task lifecycle state transitions, maintains immutable change history trails, enables flexible query filtering, and broadcasts status changes to external notification listeners.

#### Functional Requirements:
1. **Task Domain Modeling**: Represent tasks with unique identifiers, title, description, priority levels (LOW, MEDIUM, HIGH, CRITICAL), lifecycle status, and assignee.
2. **Lifecycle State Machine**: Model valid status states including CREATED, IN_PROGRESS, COMPLETED, and CANCELLED.
3. **Audited State Transitions**: Support status transitions that atomically record change entries containing timestamp, actor, original state, and target state.
4. **Task Reassignment**: Enable updating assignees while maintaining data consistency.
5. **Flexible Multi-Criteria Filtering**: Provide a TaskFilter capable of evaluating composite search queries across status, priority, and assignee fields.
6. **Observer Event Dispatch**: Provide an observer interface (TaskObserver) allowing decoupled subscribers to receive callbacks upon task creation and status modifications.
7. **Thread-Safe Data Operations**: Ensure task lookups, state transitions, and subscriber lists execute safely under concurrent access.
8. **Coordinated Lifecycle Facade**: Provide a high-level TaskManager facade coordinating creation, transition processing, and observer notification delivery.

#### Non-goals:
- Subtask dependency graphs, Gantt chart scheduling constraints, and circular dependency cycle-detection algorithms are deferred to advanced project planning tools.
- External database persistence, message queue ingestion pipelines, and HTTP REST controllers are outside the scope of this in-memory domain core.
