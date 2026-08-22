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

            // Idempotent Seeding
            for (QuestionDocument q : List.of(lruCache, reverseString, twoSum, lldOrderService)) {
                questionRepository.findBySlug(q.getSlug())
                        .ifPresentOrElse(
                                existing -> {
                                    q.setId(existing.getId());
                                    questionRepository.save(q);
                                },
                                () -> questionRepository.save(q)
                        );
            }
            log.info("✅ Question Bank initialized with {} core problems (DSA + LLD) with coaching & interviewer notes.", 4);
        } catch (Exception e) {
            log.warn("⚠️ Question Bank initialization notice: {}", e.getMessage());
        }
    }
}
