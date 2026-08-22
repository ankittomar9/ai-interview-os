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

            // 1. LRU Cache (DSA)
            ProblemDocument lruCache = ProblemDocument.builder()
                    .problemSlug("lru-cache")
                    .title("LRU Cache Implementation")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("SENIOR")
                    .buildProfile("judge0")
                    .problemStatement("""
                            ### LRU Cache (Least Recently Used)
                            Implement an LRU Cache with standard I/O operations.
                            
                            ### Input Format
                            - Line 1: An integer `capacity` representing the maximum number of items in the cache.
                            - Following lines: Operations in the format `put <key> <value>` or `get <key>`.
                            
                            ### Output Format
                            For each `get <key>` command, print the value if found, or `-1` if not found.
                            """)
                    .starterCode(Map.of(
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
                                    """
                    ))
                    .sampleTests(List.of(
                            new ProblemDocument.TestCase("Sample 1", "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4", "1\n-1\n-1\n3\n4")
                    ))
                    .hiddenTests(List.of(
                            new ProblemDocument.HiddenTestCase("Hidden 1", "1\nput 1 10\nget 1\nput 2 20\nget 1\nget 2", "10\n-1\n20", 1)
                    ))
                    .limits(new ProblemDocument.ExecutionLimits(512, 2000))
                    .build();

            // 2. Reverse a String (DSA)
            ProblemDocument reverseString = ProblemDocument.builder()
                    .problemSlug("reverse-a-string")
                    .title("Reverse a String")
                    .track("ALGORITHMS_DATA_STRUCTURES")
                    .difficulty("JUNIOR")
                    .buildProfile("judge0")
                    .problemStatement("Given a string, output the reverse.")
                    .starterCode(Map.of(
                            "java", """
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
                                    """
                    ))
                    .sampleTests(List.of(
                            new ProblemDocument.TestCase("Sample 1", "hello", "olleh")
                    ))
                    .hiddenTests(List.of(
                            new ProblemDocument.HiddenTestCase("Hidden 1", "world", "dlrow", 1)
                    ))
                    .limits(new ProblemDocument.ExecutionLimits(256, 1500))
                    .build();

            // 3. Spring Boot Order Management Service (LLD)
            ProblemDocument lldOrderService = ProblemDocument.builder()
                    .problemSlug("lld-order-service")
                    .title("Spring Boot Order Management Microservice")
                    .track("SPRING_LLD")
                    .difficulty("MID")
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
                            new ProblemDocument.TestCase("CreateOrderPersistsWithCreatedStatus", "POST /api/v1/orders with cust-101, $149.99", "201 Created with status CREATED"),
                            new ProblemDocument.TestCase("DeleteExistingOrderTrue", "DELETE /api/v1/orders/{id} on existing order", "204 No Content"),
                            new ProblemDocument.TestCase("DeleteMissingOrderFalse", "DELETE /api/v1/orders/{random-id} on missing order", "404 Not Found"),
                            new ProblemDocument.TestCase("IdsAreUniqueUUIDs", "Concurrent create orders", "Unique UUID generated per order"),
                            new ProblemDocument.TestCase("TimestampsPopulated", "Create order", "createdAt is non-null timestamp")
                    ))
                    .limits(new ProblemDocument.ExecutionLimits(768, 60000))
                    .build();

            // Upsert / Save
            for (ProblemDocument p : List.of(lruCache, reverseString, lldOrderService)) {
                problemRepository.findByProblemSlug(p.getProblemSlug())
                        .ifPresentOrElse(
                                existing -> {
                                    p.setId(existing.getId());
                                    problemRepository.save(p);
                                },
                                () -> problemRepository.save(p)
                        );
            }
            log.info("Problem catalog synchronized with {} problems (DSA + LLD).", 3);
        } catch (Exception e) {
            log.warn("⚠️ Problem library initialization notice: {}", e.getMessage());
        }
    }
}
