package com.interviewos.questionbank.initializer;

import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class QuestionDataInitializer implements CommandLineRunner {

    private final QuestionRepository questionRepository;

    @Override
    public void run(String... args) {
        try {
            log.info("🌱 Seeding Question Bank Catalog with Core Interview Curricula...");

            // 1. LRU Cache (DSA - SENIOR)
            QuestionDocument lruCache = QuestionDocument.builder()
                    .slug("lru-cache")
                    .title("LRU Cache Implementation")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("SENIOR")
                    .tags(List.of("data-structures", "hashmap", "doubly-linked-list", "caching", "java", "algorithms"))
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### LRU Cache (Least Recently Used)
                            Design and implement a data structure for Least Recently Used (LRU) cache.
                            It should support standard I/O operations:
                            - `put <key> <value>`: Insert or update the value of the key. If the number of keys exceeds the capacity, evict the least recently used key.
                            - `get <key>`: Return the value of the key if the key exists, otherwise return `-1`.

                            ### Input Format:
                            - Line 1: `capacity` (maximum items).
                            - Following lines: operations (`put <key> <value>` or `get <key>`).

                            ### Output Format:
                            - For each `get` operation, print the integer value on a new line.
                            """)
                    .starterCode("""
                            import java.util.*;

                            public class Main {
                                public static void main(String[] args) {
                                    Scanner scanner = new Scanner(System.in);
                                    if (!scanner.hasNextInt()) return;
                                    int capacity = scanner.nextInt();
                                    while (scanner.hasNext()) {
                                        String op = scanner.next();
                                        if ("put".equalsIgnoreCase(op)) {
                                            int key = scanner.nextInt();
                                            int val = scanner.nextInt();
                                        } else if ("get".equalsIgnoreCase(op)) {
                                            int key = scanner.nextInt();
                                            System.out.println(-1);
                                        }
                                    }
                                }
                            }
                            """)
                    .starterCodeMap(Map.of(
                            "java", """
                                    import java.util.*;

                                    public class Main {
                                        public static void main(String[] args) {
                                            Scanner scanner = new Scanner(System.in);
                                            if (!scanner.hasNextInt()) return;
                                            int capacity = scanner.nextInt();
                                            while (scanner.hasNext()) {
                                                String op = scanner.next();
                                                if ("put".equalsIgnoreCase(op)) {
                                                    int key = scanner.nextInt();
                                                    int val = scanner.nextInt();
                                                } else if ("get".equalsIgnoreCase(op)) {
                                                    int key = scanner.nextInt();
                                                    System.out.println(-1);
                                                }
                                            }
                                        }
                                    }
                                    """,
                            "python", """
                                    import sys

                                    def main():
                                        lines = sys.stdin.read().split()
                                        if not lines:
                                            return
                                        capacity = int(lines[0])
                                        idx = 1
                                        while idx < len(lines):
                                            op = lines[idx]
                                            if op == "put":
                                                key, val = int(lines[idx+1]), int(lines[idx+2])
                                                idx += 3
                                            elif op == "get":
                                                key = int(lines[idx+1])
                                                print(-1)
                                                idx += 2

                                    if __name__ == '__main__':
                                        main()
                                    """
                    ))
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("Sample 1", "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4", "1\n-1\n-1\n3\n4")
                    ))
                    .hiddenTests(List.of(
                            new QuestionDocument.HiddenTestCase("Hidden 1", "1\nput 1 10\nget 1\nput 2 20\nget 1\nget 2", "10\n-1\n20", 1)
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(512, 2000))
                    .evaluationCriteria(List.of(
                            "O(1) time complexity for both get and put operations",
                            "Correct eviction of least recently used item on capacity overflow",
                            "Robust pointer updates in Doubly Linked List without memory leaks"
                    ))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("Doubly Linked List + HashMap", "O(1) Get and Put", "Eviction Policy (LRU)"),
                            List.of(
                                    "How would you make this LRU Cache thread-safe under concurrent read/write throughput?",
                                    "What happens if item sizes vary (e.g. byte length) rather than uniform count-based capacity?"
                            ),
                            List.of(
                                    "Candidate explains O(1) doubly linked list node removal and head insertion before writing code.",
                                    "Candidate handles edge case when updating an existing key without incorrectly incrementing size."
                            )
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of(
                                    "Relying solely on Java LinkedHashMap when interviewer specifically asked for data structure mechanics.",
                                    "Forgetting to update the value of an existing key before moving node to head.",
                                    "NullPointerExceptions when deleting the tail or head boundary node."
                            ),
                            """
                            1. Define custom Node class (key, val, prev, next).
                            2. Maintain dummy head and dummy tail nodes to simplify pointer manipulation.
                            3. get(key): lookup node in map, moveToHead(node), return val.
                            4. put(key, val): if exists update and moveToHead; if new create node, addToHead, if size > capacity removeTail and removeFromMap.
                            """,
                            List.of(
                                    "Sketch the doubly linked list pointers on whiteboard or scratchpad before writing code.",
                                    "State the time and space complexity explicitly for both get() and put() operations upfront."
                            )
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 2. Reverse a String (DSA - JUNIOR)
            QuestionDocument reverseString = QuestionDocument.builder()
                    .slug("reverse-a-string")
                    .title("Reverse a String")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("JUNIOR")
                    .tags(List.of("strings", "pointers", "arrays", "basics", "algorithms"))
                    .buildProfile("judge0")
                    .problemStatement("Given a single line string, output the reverse.")
                    .starterCode("""
                            import java.util.Scanner;

                            public class Main {
                                public static void main(String[] args) {
                                    Scanner sc = new Scanner(System.in);
                                    if (sc.hasNextLine()) {
                                        String s = sc.nextLine();
                                        System.out.println(new StringBuilder(s).reverse().toString());
                                    }
                                }
                            }
                            """)
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("Sample 1", "hello", "olleh")
                    ))
                    .hiddenTests(List.of(
                            new QuestionDocument.HiddenTestCase("Hidden 1", "world", "dlrow", 1)
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(256, 1500))
                    .evaluationCriteria(List.of("Correct two-pointer or standard inversion", "O(N) time and O(1) auxiliary space"))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("Two pointers", "In-place reversal", "Edge case strings"),
                            List.of("How does character encoding (like UTF-16 surrogate pairs) affect in-place string reversal?"),
                            List.of("Candidate discusses space complexity between in-place char array swap vs new String construction.")
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of("Forgetting empty string or single-character string edge cases."),
                            "Convert string to char array, maintain left and right pointers, swap characters moving inward.",
                            List.of("Clarify whether the input contains Unicode/emojis or standard ASCII characters.")
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 3. Two Sum (DSA - JUNIOR / MID)
            QuestionDocument twoSum = QuestionDocument.builder()
                    .slug("two-sum")
                    .title("Two Sum Target Pair")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("JUNIOR")
                    .tags(List.of("arrays", "hashmap", "two-pointers", "search", "algorithms"))
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### Two Sum
                            Given an array of integers `nums` and an integer `target`, find the 0-based indices of the two numbers such that they add up to `target`.
                            Print the two indices separated by a space in ascending order.

                            ### Input Format:
                            - Line 1: `N target`
                            - Line 2: `N` space-separated integers.

                            ### Output Format:
                            - Print `index1 index2`.
                            """)
                    .starterCode("""
                            import java.util.*;

                            public class Main {
                                public static void main(String[] args) {
                                    Scanner sc = new Scanner(System.in);
                                    if (!sc.hasNextInt()) return;
                                    int n = sc.nextInt();
                                    int target = sc.nextInt();
                                    int[] nums = new int[n];
                                    for (int i = 0; i < n; i++) nums[i] = sc.nextInt();

                                    Map<Integer, Integer> map = new HashMap<>();
                                    for (int i = 0; i < n; i++) {
                                        int complement = target - nums[i];
                                        if (map.containsKey(complement)) {
                                            System.out.println(map.get(complement) + " " + i);
                                            return;
                                        }
                                        map.put(nums[i], i);
                                    }
                                }
                            }
                            """)
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("Sample 1", "4 9\n2 7 11 15", "0 1")
                    ))
                    .hiddenTests(List.of(
                            new QuestionDocument.HiddenTestCase("Hidden 1", "3 6\n3 2 4", "1 2", 1)
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(256, 1500))
                    .evaluationCriteria(List.of("O(N) time complexity using HashMap lookup", "Zero-based index output"))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("HashMap single-pass", "Complement arithmetic"),
                            List.of("What if the array is already sorted? Can we solve it in O(1) auxiliary space?"),
                            List.of("Candidate immediately proposes O(N) HashMap approach rather than brute force O(N^2).")
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of("Reusing the same element twice (e.g. target 6 with element 3 at index 0)."),
                            "Maintain HashMap of value -> index. For each element, calculate complement = target - num. If complement in map, return indices.",
                            List.of("Mention that HashMap gives O(N) time, and two-pointer gives O(1) space if sorted.")
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 4. Spring Boot Order Management Microservice (LLD - MID)
            QuestionDocument lldOrderService = QuestionDocument.builder()
                    .slug("lld-order-service")
                    .title("Spring Boot Order Management Microservice")
                    .track("SPRING_LLD")
                    .difficulty("MID")
                    .tags(List.of("spring-boot", "java", "jpa", "rest-api", "microservices", "lld", "backend"))
                    .buildProfile("maven-spring")
                    .problemStatement("""
                            ### Spring Boot Order Management Microservice (LLD)

                            Design and implement an Order Management service in Spring Boot 3.4.

                            #### Requirements:
                            1. **Order Model**: Managed entity with `UUID id`, `String customerId`, `Double totalAmount`, `OrderStatus status`, and `Instant createdAt`.
                            2. **Order Lifecycle (`OrderService`)**:
                               - `createOrder(OrderRequestDto request)`: Generates a unique `UUID`, initializes status to `OrderStatus.CREATED`, sets `Instant.now()`, and saves to repository.
                               - `getOrderById(UUID id)`: Retrieves the order or returns `Optional.empty()`.
                               - `deleteOrder(UUID id)`: Deletes the order; returns `true` if existed & deleted, `false` otherwise.
                               - `listOrders()`: Returns all orders mapped to response DTOs.
                            3. **REST Endpoints (`OrderController`)**:
                               - `POST /api/v1/orders` -> 201 Created with `OrderResponseDto`
                               - `GET /api/v1/orders/{id}` -> 200 OK or 404 Not Found
                               - `DELETE /api/v1/orders/{id}` -> 204 No Content or 404 Not Found
                               - `GET /api/v1/orders` -> 200 OK with `List<OrderResponseDto>`

                            #### Candidate Editable Files:
                            - `src/main/java/com/example/orderservice/service/OrderService.java`
                            - `src/main/java/com/example/orderservice/controller/OrderController.java`
                            """)
                    .starterFiles(Map.of(
                            "pom.xml", """
                                    <?xml version="1.0" encoding="UTF-8"?>
                                    <project xmlns="http://maven.apache.org/POM/4.0.0"
                                             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                                             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
                                        <modelVersion>4.0.0</modelVersion>
                                        <groupId>com.example</groupId>
                                        <artifactId>order-service</artifactId>
                                        <version>1.0.0</version>
                                        <parent>
                                            <groupId>org.springframework.boot</groupId>
                                            <artifactId>spring-boot-starter-parent</artifactId>
                                            <version>3.4.1</version>
                                            <relativePath/>
                                        </parent>
                                        <properties>
                                            <java.version>21</java.version>
                                        </properties>
                                        <dependencies>
                                            <dependency>
                                                <groupId>org.springframework.boot</groupId>
                                                <artifactId>spring-boot-starter-web</artifactId>
                                            </dependency>
                                            <dependency>
                                                <groupId>org.springframework.boot</groupId>
                                                <artifactId>spring-boot-starter-data-jpa</artifactId>
                                            </dependency>
                                            <dependency>
                                                <groupId>com.h2database</groupId>
                                                <artifactId>h2</artifactId>
                                                <scope>runtime</scope>
                                            </dependency>
                                            <dependency>
                                                <groupId>org.springframework.boot</groupId>
                                                <artifactId>spring-boot-starter-test</artifactId>
                                                <scope>test</scope>
                                            </dependency>
                                        </dependencies>
                                    </project>
                                    """,
                            "src/main/java/com/example/orderservice/OrderServiceApplication.java", """
                                    package com.example.orderservice;

                                    import org.springframework.boot.SpringApplication;
                                    import org.springframework.boot.autoconfigure.SpringBootApplication;

                                    @SpringBootApplication
                                    public class OrderServiceApplication {
                                        public static void main(String[] args) {
                                            SpringApplication.run(OrderServiceApplication.class, args);
                                        }
                                    }
                                    """,
                            "src/main/java/com/example/orderservice/model/OrderStatus.java", """
                                    package com.example.orderservice.model;

                                    public enum OrderStatus {
                                        CREATED,
                                        PENDING,
                                        COMPLETED,
                                        CANCELLED
                                    }
                                    """,
                            "src/main/java/com/example/orderservice/model/Order.java", """
                                    package com.example.orderservice.model;

                                    import jakarta.persistence.*;
                                    import java.time.Instant;
                                    import java.util.UUID;

                                    @Entity
                                    @Table(name = "orders")
                                    public class Order {
                                        @Id
                                        private UUID id;

                                        @Column(nullable = false)
                                        private String customerId;

                                        @Column(nullable = false)
                                        private Double totalAmount;

                                        @Enumerated(EnumType.STRING)
                                        @Column(nullable = false)
                                        private OrderStatus status;

                                        @Column(nullable = false)
                                        private Instant createdAt;

                                        public Order() {}

                                        public Order(UUID id, String customerId, Double totalAmount, OrderStatus status, Instant createdAt) {
                                            this.id = id;
                                            this.customerId = customerId;
                                            this.totalAmount = totalAmount;
                                            this.status = status;
                                            this.createdAt = createdAt;
                                        }

                                        public UUID getId() { return id; }
                                        public void setId(UUID id) { this.id = id; }
                                        public String getCustomerId() { return customerId; }
                                        public void setCustomerId(String customerId) { this.customerId = customerId; }
                                        public Double getTotalAmount() { return totalAmount; }
                                        public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
                                        public OrderStatus getStatus() { return status; }
                                        public void setStatus(OrderStatus status) { this.status = status; }
                                        public Instant getCreatedAt() { return createdAt; }
                                        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
                                    }
                                    """,
                            "src/main/java/com/example/orderservice/dto/OrderRequestDto.java", """
                                    package com.example.orderservice.dto;

                                    public record OrderRequestDto(
                                        String customerId,
                                        Double totalAmount
                                    ) {}
                                    """,
                            "src/main/java/com/example/orderservice/dto/OrderResponseDto.java", """
                                    package com.example.orderservice.dto;

                                    import com.example.orderservice.model.OrderStatus;
                                    import java.time.Instant;
                                    import java.util.UUID;

                                    public record OrderResponseDto(
                                        UUID id,
                                        String customerId,
                                        Double totalAmount,
                                        OrderStatus status,
                                        Instant createdAt
                                    ) {}
                                    """,
                            "src/main/java/com/example/orderservice/repository/OrderRepository.java", """
                                    package com.example.orderservice.repository;

                                    import com.example.orderservice.model.Order;
                                    import org.springframework.data.jpa.repository.JpaRepository;
                                    import org.springframework.stereotype.Repository;

                                    import java.util.UUID;

                                    @Repository
                                    public interface OrderRepository extends JpaRepository<Order, UUID> {
                                    }
                                    """,
                            "src/main/java/com/example/orderservice/service/IOrderService.java", """
                                    package com.example.orderservice.service;

                                    import com.example.orderservice.dto.OrderRequestDto;
                                    import com.example.orderservice.dto.OrderResponseDto;

                                    import java.util.List;
                                    import java.util.Optional;
                                    import java.util.UUID;

                                    public interface IOrderService {
                                        OrderResponseDto createOrder(OrderRequestDto request);
                                        Optional<OrderResponseDto> getOrderById(UUID id);
                                        boolean deleteOrder(UUID id);
                                        List<OrderResponseDto> listOrders();
                                    }
                                    """,
                            "src/main/java/com/example/orderservice/service/OrderService.java", """
                                    package com.example.orderservice.service;

                                    import com.example.orderservice.dto.OrderRequestDto;
                                    import com.example.orderservice.dto.OrderResponseDto;
                                    import com.example.orderservice.model.Order;
                                    import com.example.orderservice.model.OrderStatus;
                                    import com.example.orderservice.repository.OrderRepository;
                                    import org.springframework.stereotype.Service;

                                    import java.time.Instant;
                                    import java.util.List;
                                    import java.util.Optional;
                                    import java.util.UUID;

                                    @Service
                                    public class OrderService implements IOrderService {

                                        private final OrderRepository orderRepository;

                                        public OrderService(OrderRepository orderRepository) {
                                            this.orderRepository = orderRepository;
                                        }

                                        @Override
                                        public OrderResponseDto createOrder(OrderRequestDto request) {
                                            // TODO: Implement createOrder (generate UUID, status CREATED, Instant.now())
                                            throw new UnsupportedOperationException("TODO: Implement createOrder");
                                        }

                                        @Override
                                        public Optional<OrderResponseDto> getOrderById(UUID id) {
                                            // TODO: Implement getOrderById
                                            throw new UnsupportedOperationException("TODO: Implement getOrderById");
                                        }

                                        @Override
                                        public boolean deleteOrder(UUID id) {
                                            // TODO: Implement deleteOrder
                                            throw new UnsupportedOperationException("TODO: Implement deleteOrder");
                                        }

                                        @Override
                                        public List<OrderResponseDto> listOrders() {
                                            // TODO: Implement listOrders
                                            throw new UnsupportedOperationException("TODO: Implement listOrders");
                                        }
                                    }
                                    """,
                            "src/main/java/com/example/orderservice/controller/OrderController.java", """
                                    package com.example.orderservice.controller;

                                    import com.example.orderservice.dto.OrderRequestDto;
                                    import com.example.orderservice.dto.OrderResponseDto;
                                    import com.example.orderservice.service.IOrderService;
                                    import org.springframework.http.HttpStatus;
                                    import org.springframework.http.ResponseEntity;
                                    import org.springframework.web.bind.annotation.*;

                                    import java.util.List;
                                    import java.util.UUID;

                                    @RestController
                                    @RequestMapping("/api/v1/orders")
                                    public class OrderController {

                                        private final IOrderService orderService;

                                        public OrderController(IOrderService orderService) {
                                            this.orderService = orderService;
                                        }

                                        @PostMapping
                                        public ResponseEntity<OrderResponseDto> createOrder(@RequestBody OrderRequestDto request) {
                                            OrderResponseDto response = orderService.createOrder(request);
                                            return ResponseEntity.status(HttpStatus.CREATED).body(response);
                                        }

                                        @GetMapping("/{id}")
                                        public ResponseEntity<OrderResponseDto> getOrder(@PathVariable UUID id) {
                                            return orderService.getOrderById(id)
                                                    .map(ResponseEntity::ok)
                                                    .orElse(ResponseEntity.notFound().build());
                                        }

                                        @DeleteMapping("/{id}")
                                        public ResponseEntity<Void> deleteOrder(@PathVariable UUID id) {
                                            boolean deleted = orderService.deleteOrder(id);
                                            return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
                                        }

                                        @GetMapping
                                        public ResponseEntity<List<OrderResponseDto>> listOrders() {
                                            return ResponseEntity.ok(orderService.listOrders());
                                        }
                                    }
                                    """
                    ))
                    .editablePaths(List.of(
                            "src/main/java/com/example/orderservice/service/OrderService.java",
                            "src/main/java/com/example/orderservice/controller/OrderController.java"
                    ))
                    .hiddenTestFiles(Map.of(
                            "src/test/java/com/example/orderservice/OrderServiceIntegrationTest.java", """
                                    package com.example.orderservice;

                                    import com.example.orderservice.dto.OrderRequestDto;
                                    import com.example.orderservice.dto.OrderResponseDto;
                                    import com.example.orderservice.model.OrderStatus;
                                    import com.example.orderservice.service.IOrderService;
                                    import org.junit.jupiter.api.DisplayName;
                                    import org.junit.jupiter.api.Test;
                                    import org.springframework.beans.factory.annotation.Autowired;
                                    import org.springframework.boot.test.context.SpringBootTest;

                                    import java.util.UUID;

                                    import static org.junit.jupiter.api.Assertions.*;

                                    @SpringBootTest
                                    class OrderServiceIntegrationTest {

                                        @Autowired
                                        private IOrderService orderService;

                                        @Test
                                        @DisplayName("CreateOrderPersistsWithCreatedStatus")
                                        void testCreateOrderPersistsWithCreatedStatus() {
                                            OrderRequestDto request = new OrderRequestDto("cust-101", 149.99);
                                            OrderResponseDto response = orderService.createOrder(request);

                                            assertNotNull(response);
                                            assertNotNull(response.id());
                                            assertEquals("cust-101", response.customerId());
                                            assertEquals(149.99, response.totalAmount());
                                            assertEquals(OrderStatus.CREATED, response.status());
                                        }

                                        @Test
                                        @DisplayName("DeleteExistingOrderTrue")
                                        void testDeleteExistingOrderTrue() {
                                            OrderRequestDto request = new OrderRequestDto("cust-102", 49.50);
                                            OrderResponseDto created = orderService.createOrder(request);

                                            boolean deleted = orderService.deleteOrder(created.id());
                                            assertTrue(deleted);
                                            assertTrue(orderService.getOrderById(created.id()).isEmpty());
                                        }

                                        @Test
                                        @DisplayName("DeleteMissingOrderFalse")
                                        void testDeleteMissingOrderFalse() {
                                            UUID randomId = UUID.randomUUID();
                                            boolean deleted = orderService.deleteOrder(randomId);
                                            assertFalse(deleted);
                                        }

                                        @Test
                                        @DisplayName("IdsAreUniqueUUIDs")
                                        void testIdsAreUniqueUUIDs() {
                                            OrderResponseDto o1 = orderService.createOrder(new OrderRequestDto("c1", 10.0));
                                            OrderResponseDto o2 = orderService.createOrder(new OrderRequestDto("c2", 20.0));

                                            assertNotNull(o1.id());
                                            assertNotNull(o2.id());
                                            assertNotEquals(o1.id(), o2.id());
                                        }

                                        @Test
                                        @DisplayName("TimestampsPopulated")
                                        void testTimestampsPopulated() {
                                            OrderResponseDto o = orderService.createOrder(new OrderRequestDto("c3", 99.0));
                                            assertNotNull(o.createdAt());
                                        }
                                    }
                                    """
                    ))
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("CreateOrderPersistsWithCreatedStatus", "", "", "POST /api/v1/orders with customerId and amount returns 201 Created and CREATED status"),
                            new QuestionDocument.TestCase("DeleteExistingOrderTrue", "", "", "DELETE /api/v1/orders/{id} on existing order returns 204 No Content"),
                            new QuestionDocument.TestCase("DeleteMissingOrderFalse", "", "", "DELETE /api/v1/orders/{random-id} returns 404 Not Found"),
                            new QuestionDocument.TestCase("IdsAreUniqueUUIDs", "", "", "Consecutive order creations generate unique UUIDs"),
                            new QuestionDocument.TestCase("TimestampsPopulated", "", "", "Created order has non-null Instant timestamp")
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(768, 60000))
                    .evaluationCriteria(List.of(
                            "Spring Boot 3 REST controller mapping and status codes",
                            "Encapsulation of Order entity behind request/response DTOs",
                            "Transactional JPA data persistence and clean separation of concerns"
                    ))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("Spring Boot 3 REST controller mapping", "JPA Repository lifecycle", "UUID identifier generation", "DTO request/response encapsulation", "Layered Architecture"),
                            List.of(
                                    "Why return an OrderResponseDto rather than exposing the JPA Order entity directly in controller responses?",
                                    "Where should input validation and business invariant checks live as this microservice scales?",
                                    "How would you handle idempotent order placement to prevent double billing on network retry?"
                            ),
                            List.of(
                                    "Candidate checks for non-null fields and throws or handles empty Optional appropriately.",
                                    "Candidate leverages dependency injection via constructor rather than field @Autowired.",
                                    "Candidate returns 201 Created on POST and 204/404 on DELETE."
                            )
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of(
                                    "Exposing JPA entity models directly in REST controller method signatures.",
                                    "Using field injection (@Autowired) instead of constructor injection.",
                                    "Forgetting to return 404 when deleting a non-existent order."
                            ),
                            """
                            1. OrderService implements IOrderService.
                            2. In createOrder: validate request, instantiate Order with UUID.randomUUID(), CREATED status, and Instant.now(), save to orderRepository, map to OrderResponseDto.
                            3. In getOrderById: return orderRepository.findById(id).map(this::toDto).
                            4. In deleteOrder: check existsById(id), if true deleteById(id) and return true, else false.
                            """,
                            List.of(
                                    "Discuss transaction boundaries (@Transactional) and database isolation levels.",
                                    "Mention idempotency keys for payment and order creation APIs."
                            )
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 5. Merge K Sorted Lists (DSA - SENIOR)
            QuestionDocument mergeKSortedLists = QuestionDocument.builder()
                    .slug("merge-k-sorted-lists")
                    .title("Merge K Sorted Lists")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("SENIOR")
                    .tags(List.of("heap", "priority-queue", "divide-and-conquer", "linked-list", "java"))
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### Merge k Sorted Lists
                            You are given an array of `k` linked-lists `lists`, each linked-list is sorted in ascending order.
                            Merge all the linked-lists into one sorted linked-list and return it.

                            ### Input Format:
                            - Line 1: `k` (number of lists).
                            - Next `k` lines: space-separated integers for each list.

                            ### Output Format:
                            - Single line of space-separated integers in sorted order.
                            """)
                    .starterCode("""
                            import java.util.*;

                            public class Main {
                                public static void main(String[] args) {
                                    Scanner scanner = new Scanner(System.in);
                                    if (!scanner.hasNextInt()) return;
                                    int k = scanner.nextInt();
                                    PriorityQueue<Integer> pq = new PriorityQueue<>();
                                    for (int i = 0; i < k; i++) {
                                        int n = scanner.nextInt();
                                        for (int j = 0; j < n; j++) {
                                            pq.offer(scanner.nextInt());
                                        }
                                    }
                                    StringBuilder sb = new StringBuilder();
                                    while (!pq.isEmpty()) {
                                        sb.append(pq.poll()).append(" ");
                                    }
                                    System.out.println(sb.toString().trim());
                                }
                            }
                            """)
                    .starterCodeMap(Map.of(
                            "java", """
                                    import java.util.*;

                                    public class Main {
                                        public static void main(String[] args) {
                                            Scanner scanner = new Scanner(System.in);
                                            if (!scanner.hasNextInt()) return;
                                            int k = scanner.nextInt();
                                            PriorityQueue<Integer> pq = new PriorityQueue<>();
                                            for (int i = 0; i < k; i++) {
                                                int n = scanner.nextInt();
                                                for (int j = 0; j < n; j++) {
                                                    pq.offer(scanner.nextInt());
                                                }
                                            }
                                            StringBuilder sb = new StringBuilder();
                                            while (!pq.isEmpty()) {
                                                sb.append(pq.poll()).append(" ");
                                            }
                                            System.out.println(sb.toString().trim());
                                        }
                                    }
                                    """,
                            "python", """
                                    import heapq
                                    import sys

                                    def main():
                                        input_data = sys.stdin.read().split()
                                        if not input_data:
                                            return
                                        k = int(input_data[0])
                                        pq = []
                                        idx = 1
                                        for _ in range(k):
                                            n = int(input_data[idx])
                                            idx += 1
                                            for _ in range(n):
                                                heapq.heappush(pq, int(input_data[idx]))
                                                idx += 1
                                        res = []
                                        while pq:
                                            res.append(str(heapq.heappop(pq)))
                                        print(" ".join(res))

                                    if __name__ == '__main__':
                                        main()
                                    """
                    ))
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("Example1", "3\n3 1 4 5\n3 1 3 4\n2 2 6", "1 1 2 3 4 5 6"),
                            new QuestionDocument.TestCase("EmptyLists", "0", "")
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(256, 3000))
                    .evaluationCriteria(List.of("Min-Heap / PriorityQueue O(N log k) complexity", "Handling empty lists gracefully"))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("Min-Heap", "Divide and Conquer", "Time Complexity Analysis"),
                            List.of("What is the time complexity difference between pairing lists vs using a Min-Heap of size k?"),
                            List.of("Candidate identifies O(N log k) time complexity and O(k) auxiliary space.")
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of("Inserting all N elements into heap at once resulting in O(N log N) instead of O(N log k)."),
                            "Maintain a Min-Heap of size k holding the current head node of each of the k lists.",
                            List.of("Clarify if total node count N fits in memory.")
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 6. Valid Parentheses (DSA - JUNIOR)
            QuestionDocument validParentheses = QuestionDocument.builder()
                    .slug("valid-parentheses")
                    .title("Valid Parentheses")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("JUNIOR")
                    .tags(List.of("stack", "strings", "algorithms", "java"))
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### Valid Parentheses
                            Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.

                            An input string is valid if:
                            1. Open brackets must be closed by the same type of brackets.
                            2. Open brackets must be closed in the correct order.
                            3. Every close bracket has a corresponding open bracket of the same type.

                            ### Input Format:
                            - Line 1: String `s`.

                            ### Output Format:
                            - Print `true` if valid, otherwise `false`.
                            """)
                    .starterCode("""
                            import java.util.*;

                            public class Main {
                                public static void main(String[] args) {
                                    Scanner scanner = new Scanner(System.in);
                                    if (!scanner.hasNext()) {
                                        System.out.println(true);
                                        return;
                                    }
                                    String s = scanner.next();
                                    Stack<Character> stack = new Stack<>();
                                    boolean valid = true;
                                    for (char c : s.toCharArray()) {
                                        if (c == '(') stack.push(')');
                                        else if (c == '{') stack.push('}');
                                        else if (c == '[') stack.push(']');
                                        else if (stack.isEmpty() || stack.pop() != c) {
                                            valid = false;
                                            break;
                                        }
                                    }
                                    System.out.println(valid && stack.isEmpty());
                                }
                            }
                            """)
                    .starterCodeMap(Map.of(
                            "java", """
                                    import java.util.*;

                                    public class Main {
                                        public static void main(String[] args) {
                                            Scanner scanner = new Scanner(System.in);
                                            if (!scanner.hasNext()) {
                                                System.out.println(true);
                                                return;
                                            }
                                            String s = scanner.next();
                                            Stack<Character> stack = new Stack<>();
                                            boolean valid = true;
                                            for (char c : s.toCharArray()) {
                                                if (c == '(') stack.push(')');
                                                else if (c == '{') stack.push('}');
                                                else if (c == '[') stack.push(']');
                                                else if (stack.isEmpty() || stack.pop() != c) {
                                                    valid = false;
                                                    break;
                                                }
                                            }
                                            System.out.println(valid && stack.isEmpty());
                                        }
                                    }
                                    """,
                            "python", """
                                    import sys

                                    def main():
                                        line = sys.stdin.read().strip()
                                        if not line:
                                            print("true")
                                            return
                                        stack = []
                                        mapping = {')': '(', '}': '{', ']': '['}
                                        valid = True
                                        for char in line:
                                            if char in mapping.values():
                                                stack.append(char)
                                            elif char in mapping:
                                                if not stack or stack.pop() != mapping[char]:
                                                    valid = False
                                                    break
                                        print("true" if valid and not stack else "false")

                                    if __name__ == '__main__':
                                        main()
                                    """
                    ))
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("Example1", "()[]{}", "true"),
                            new QuestionDocument.TestCase("Example2", "(]", "false"),
                            new QuestionDocument.TestCase("Example3", "([)]", "false")
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(128, 2000))
                    .evaluationCriteria(List.of("Stack LIFO correctness", "Handling empty string and unmatched brackets"))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("Stack", "LIFO", "String Parsing"),
                            List.of("How do you handle early exit on odd length string?"),
                            List.of("Checks if stack is empty after iteration.")
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of("Forgetting to check if stack is empty at the end."),
                            "Push expected matching closing characters onto stack and match on pop.",
                            List.of("Mention space complexity O(N) in worst case.")
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 7. Longest Substring Without Repeating Characters (DSA - MID)
            QuestionDocument longestSubstring = QuestionDocument.builder()
                    .slug("longest-substring-without-repeating-characters")
                    .title("Longest Substring Without Repeating Characters")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("MID")
                    .tags(List.of("sliding-window", "hashmap", "two-pointers", "strings", "java"))
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### Longest Substring Without Repeating Characters
                            Given a string `s`, find the length of the longest substring without repeating characters.

                            ### Input Format:
                            - Line 1: String `s`.

                            ### Output Format:
                            - Print single integer representing the maximum length.
                            """)
                    .starterCode("""
                            import java.util.*;

                            public class Main {
                                public static void main(String[] args) {
                                    Scanner scanner = new Scanner(System.in);
                                    if (!scanner.hasNextLine()) {
                                        System.out.println(0);
                                        return;
                                    }
                                    String s = scanner.nextLine();
                                    Map<Character, Integer> lastSeen = new HashMap<>();
                                    int maxLen = 0;
                                    int left = 0;
                                    for (int right = 0; right < s.length(); right++) {
                                        char c = s.charAt(right);
                                        if (lastSeen.containsKey(c)) {
                                            left = Math.max(left, lastSeen.get(c) + 1);
                                        }
                                        lastSeen.put(c, right);
                                        maxLen = Math.max(maxLen, right - left + 1);
                                    }
                                    System.out.println(maxLen);
                                }
                            }
                            """)
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("Example1", "abcabcbb", "3"),
                            new QuestionDocument.TestCase("Example2", "bbbbb", "1"),
                            new QuestionDocument.TestCase("Example3", "pwwkew", "3")
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(128, 2000))
                    .evaluationCriteria(List.of("Sliding Window O(N) time complexity", "Auxiliary map for last seen index"))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("Sliding Window", "Two Pointers", "HashMap Index Tracking"),
                            List.of("Why is Math.max(left, lastSeen.get(c) + 1) necessary when a character was seen before the current window?"),
                            List.of("Candidate explains why the window left bound cannot move backwards.")
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of("Moving left pointer without Math.max check causing window left bound to shift backwards."),
                            "Use HashMap to store char -> last index. Update left pointer = max(left, lastSeen + 1).",
                            List.of("Explain difference between substring and subsequence.")
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 8. SQL Customer Analytics (SQL - MID)
            QuestionDocument sqlCustomerAnalytics = QuestionDocument.builder()
                    .slug("sql-customer-analytics")
                    .title("Customer Order & Revenue Analytics")
                    .track("SQL")
                    .difficulty("MID")
                    .tags(List.of("sql", "aggregation", "joins", "group-by", "analytics"))
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### Customer Order & Revenue Analytics
                            Write a SQL query that reports the `customer_id`, `customer_name`, `total_orders`, and `total_spent` for all customers.
                            Include customers who have placed zero orders (with `total_orders = 0` and `total_spent = 0.00`).
                            Sort the results by `total_spent` descending, then by `customer_name` ascending.

                            ### Schema:
                            - `customers (id INT PRIMARY KEY, name VARCHAR(100), signup_date DATE)`
                            - `orders (id INT PRIMARY KEY, customer_id INT, order_date DATE, total_amount DECIMAL(10,2))`
                            """)
                    .starterCode("""
                            -- Write your SQL query below:
                            SELECT
                                c.id AS customer_id,
                                c.name AS customer_name,
                                COUNT(o.id) AS total_orders,
                                COALESCE(SUM(o.total_amount), 0.00) AS total_spent
                            FROM customers c
                            LEFT JOIN orders o ON c.id = o.customer_id
                            GROUP BY c.id, c.name
                            ORDER BY total_spent DESC, customer_name ASC;
                            """)
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("SampleAggregate", "", "", "Returns aggregated total_spent with LEFT JOIN on customers")
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(256, 3000))
                    .evaluationCriteria(List.of("Correct LEFT JOIN preserving zero-order customers", "COALESCE/IFNULL for zero spending", "Correct GROUP BY and ORDER BY"))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("LEFT JOIN vs INNER JOIN", "COALESCE function", "GROUP BY aggregation rules"),
                            List.of("Why would an INNER JOIN produce incorrect results for newly registered customers?"),
                            List.of("Candidate explains handling NULLs in SUM and COUNT(o.id) vs COUNT(*).")
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of("Using COUNT(*) which would count 1 for customers with 0 orders due to the null joined row."),
                            "Use LEFT JOIN with COUNT(o.id) and COALESCE(SUM(o.total_amount), 0).",
                            List.of("Always test edge cases like customers with no orders.")
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 9. SQL Monthly Recurring Revenue (SQL - SENIOR)
            QuestionDocument sqlMrr = QuestionDocument.builder()
                    .slug("sql-monthly-recurring-revenue")
                    .title("Monthly Recurring Revenue (MRR) Cohort Growth")
                    .track("SQL")
                    .difficulty("SENIOR")
                    .tags(List.of("sql", "window-functions", "cte", "lag", "financial-analytics"))
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### Monthly Recurring Revenue (MRR) Growth
                            Calculate the monthly revenue and Month-over-Month (MoM) revenue growth percentage for a SaaS platform.
                            Output: `revenue_month` (YYYY-MM), `total_mrr`, `prev_month_mrr`, and `mom_growth_pct` rounded to 2 decimal places.

                            ### Schema:
                            - `subscriptions (id INT, customer_id INT, amount DECIMAL(10,2), start_date DATE, end_date DATE, status VARCHAR(20))`
                            """)
                    .starterCode("""
                            -- Write your SQL query using CTE and LAG() window function:
                            WITH monthly_rev AS (
                                SELECT
                                    TO_CHAR(start_date, 'YYYY-MM') AS revenue_month,
                                    SUM(amount) AS total_mrr
                                FROM subscriptions
                                WHERE status = 'ACTIVE'
                                GROUP BY TO_CHAR(start_date, 'YYYY-MM')
                            )
                            SELECT
                                revenue_month,
                                total_mrr,
                                LAG(total_mrr, 1) OVER (ORDER BY revenue_month) AS prev_month_mrr,
                                ROUND(((total_mrr - LAG(total_mrr, 1) OVER (ORDER BY revenue_month)) / NULLIF(LAG(total_mrr, 1) OVER (ORDER BY revenue_month), 0)) * 100, 2) AS mom_growth_pct
                            FROM monthly_rev
                            ORDER BY revenue_month;
                            """)
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("CohortCalculation", "", "", "Computes MoM percentage growth across active subscription cohorts")
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(256, 3000))
                    .evaluationCriteria(List.of("Common Table Expressions (CTE)", "LAG() window function", "NULLIF division-by-zero protection"))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("Window Functions", "LAG/LEAD", "NULLIF", "Time-series aggregation"),
                            List.of("How do you handle months where no revenue was generated (sparse data)?"),
                            List.of("Candidate discusses generate_series / date calendar tables.")
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of("Dividing by zero when previous month MRR is 0 or null."),
                            "Use LAG(total_mrr) with NULLIF to safely calculate percentage growth.",
                            List.of("Mention indexing on (status, start_date) for high performance.")
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 10. Distributed Rate Limiter (SYSTEM_DESIGN - SENIOR)
            QuestionDocument distributedRateLimiter = QuestionDocument.builder()
                    .slug("distributed-rate-limiter")
                    .title("Design a Distributed Rate Limiter")
                    .track("SYSTEM_DESIGN")
                    .difficulty("SENIOR")
                    .tags(List.of("system-design", "distributed-systems", "redis", "token-bucket", "sliding-window"))
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### Design a Distributed Rate Limiter
                            Design a high-throughput, low-latency distributed rate limiter service that enforces API tier limits (e.g. 10,000 requests/sec per client IP or API key) across multiple global regions.

                            ### Key Requirements:
                            1. Low latency: Sub-millisecond latency overhead per API request.
                            2. Distributed accuracy: Accurate sliding-window or token-bucket accounting across independent gateway pods without race conditions.
                            3. High availability: Graceful degradation if the distributed cache is unreachable.
                            """)
                    .starterCode("""
                            // Architectural Notes & Design Document:
                            // 1. Algorithm: Token Bucket vs Sliding Window Counter in Redis (Lua script)
                            // 2. Data Store: Redis Cluster with local in-memory L1 cache (Caffeine)
                            // 3. Concurrency: Atomic Lua scripts or Redis cell modules
                            // 4. Fallback: Fail-open strategy on Redis connectivity loss
                            """)
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("SystemDesignScenario", "", "", "Evaluated by AI Principal Bar Raiser on architectural depth")
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(256, 3000))
                    .evaluationCriteria(List.of("Token Bucket vs Sliding Window trade-offs", "Redis Lua script atomicity", "L1 Local + L2 Distributed Caching", "Fail-open vs Fail-closed policies"))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("Rate Limiting Algorithms", "Redis Lua Scripts", "Multi-region synchronization", "Race Conditions"),
                            List.of("How do you prevent Redis hotkey contention for a client sending 100k req/sec?"),
                            List.of("Candidate proposes local batching / token pre-fetching or consistent hashing.")
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of("Using non-atomic GET then SET causing race conditions under concurrent requests."),
                            "Leverage Redis with atomic Lua scripting or sliding window log with ZADD/ZREMRANGEBYSCORE.",
                            List.of("Draw client -> API Gateway -> Rate Limiter -> Backend flow clearly.")
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 11. URL Shortener (SYSTEM_DESIGN - MID)
            QuestionDocument urlShortener = QuestionDocument.builder()
                    .slug("url-shortener-system-design")
                    .title("Design a Global URL Shortener (TinyURL)")
                    .track("SYSTEM_DESIGN")
                    .difficulty("MID")
                    .tags(List.of("system-design", "base62", "hashing", "nosql", "caching"))
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### Design a Global URL Shortener (e.g., TinyURL / Bitly)
                            Design a scalable, highly available URL shortening service that generates 7-character aliases for long URLs.

                            ### Key Requirements:
                            1. Read-heavy traffic (100:1 read to write ratio).
                            2. 100 million new URLs generated per month; 10 billion reads per month.
                            3. Short URLs must be unique, non-guessable, and redirect with HTTP 301/302.
                            """)
                    .starterCode("""
                            // Architectural Notes & Design Document:
                            // 1. ID Generation: Base62 encoding on 64-bit unique ID (Snowflake or Zookeeper Range Allocation)
                            // 2. Storage: NoSQL Key-Value Store (Cassandra or DynamoDB)
                            // 3. Caching: Redis cluster caching top 20% hot URLs (80-20 Pareto Rule)
                            // 4. Redirect: 301 Permanent Redirect (client caching) vs 302 Temporary Redirect (analytics tracking)
                            """)
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("SystemDesignScenario", "", "", "Evaluated by AI Principal Bar Raiser on capacity estimation & schema")
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(256, 3000))
                    .evaluationCriteria(List.of("Capacity estimation (QPS, Storage, Bandwidth)", "Base62 Encoding vs MD5/SHA-256 Hashing", "Database indexing & replication", "Cache eviction policies (LRU)"))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("Base62 Encoding", "Distributed ID Generators", "HTTP 301 vs 302", "Cache-aside pattern"),
                            List.of("How would you scale writes if the centralized ID generator becomes a bottleneck?"),
                            List.of("Candidate allocates ranges of IDs to each application server in advance.")
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of("Hashing long URL with MD5 and truncating without handling hash collisions."),
                            "Use auto-incrementing 64-bit ID mapped to Base62 string (62^7 = 3.5 trillion URLs).",
                            List.of("Highlight the difference between 301 (caching) and 302 (telemetry).")
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // 12. Behavioral STAR: Technical Conflict Resolution (BEHAVIORAL_STAR / RESUME_BASED - SENIOR)
            QuestionDocument behavioralConflict = QuestionDocument.builder()
                    .slug("behavioral-technical-conflict")
                    .title("Resolving a Critical Architectural Disagreement")
                    .track("BEHAVIORAL_STAR")
                    .difficulty("SENIOR")
                    .tags(List.of("behavioral", "star-method", "leadership", "conflict-resolution", "architecture"))
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### Behavioral STAR: Resolving a Critical Architectural Disagreement
                            Describe a situation where you had a significant technical disagreement with a teammate, tech lead, or product manager regarding system architecture or engineering priorities.

                            ### Structure Your Response using the STAR Method:
                            - **Situation**: What was the project, the stakes, and the technical decision?
                            - **Task**: What was your responsibility, and why was the disagreement critical to the project outcome?
                            - **Action**: How did you bridge the technical gap (e.g. data-driven POCs, RFC design reviews, customer impact analysis)?
                            - **Result**: What was the outcome, what metrics improved, and what did you learn about engineering leadership?
                            """)
                    .starterCode("""
                            // Thought Notes & STAR Response Scratchpad:
                            // Situation:
                            // Task:
                            // Action:
                            // Result:
                            """)
                    .sampleTests(List.of(
                            new QuestionDocument.TestCase("STARStructuredDialogue", "", "", "Evaluated by AI Principal Bar Raiser on ownership, data-driven alignment, and empathy")
                    ))
                    .limits(new QuestionDocument.ExecutionLimits(256, 3000))
                    .evaluationCriteria(List.of("Clear STAR narrative structure", "Data-driven objective decision making", "Empathy and constructive collaboration", "Long-term impact and self-reflection"))
                    .interviewerNotes(new QuestionDocument.InterviewerNotes(
                            List.of("STAR Framework", "Data-Driven Consensus", "Disagree and Commit", "Ownership"),
                            List.of("What would you have done differently if the technical data had proven your hypothesis wrong?"),
                            List.of("Candidate demonstrates humility, objective benchmarking, and team cohesion.")
                    ))
                    .coaching(new QuestionDocument.CoachingContent(
                            List.of("Focusing on personal conflict rather than technical merits and customer impact."),
                            "Frame the disagreement around shared goals, measurable prototypes, and collaborative RFCs.",
                            List.of("Always articulate concrete business and engineering metrics in the Result.")
                    ))
                    .status("PUBLISHED")
                    .source("CORE")
                    .build();

            // Idempotent Seeding for all 12 questions
            List<QuestionDocument> all12Questions = List.of(
                    lruCache,
                    reverseString,
                    twoSum,
                    lldOrderService,
                    mergeKSortedLists,
                    validParentheses,
                    longestSubstring,
                    sqlCustomerAnalytics,
                    sqlMrr,
                    distributedRateLimiter,
                    urlShortener,
                    behavioralConflict
            );

            for (QuestionDocument q : all12Questions) {
                questionRepository.findBySlug(q.getSlug())
                        .ifPresentOrElse(
                                existing -> {
                                    q.setId(existing.getId());
                                    questionRepository.save(q);
                                },
                                () -> questionRepository.save(q)
                        );
            }
            log.info("✅ Question Bank initialized with {} core problems across DSA, SQL, LLD, System Design, and STAR tracks.", all12Questions.size());
        } catch (Exception e) {
            log.warn("⚠️ Question Bank initialization notice: {}", e.getMessage());
        }
    }
}
