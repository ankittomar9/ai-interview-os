---
slug: lld-pubsub
title: Publish-Subscribe Message Broker
track: SPRING_LLD
difficulty: HARD
topics:
- lld
est_minutes: 45
tags:
- object-oriented-design
- lld
- java
- design-patterns
- observer-pattern
- pubsub
- message-broker
buildProfile: maven-workspace
source: inspired-by:takeuforward-prep-hub/lld/pubsub
status: PUBLISHED
hints:
- Use ConcurrentHashMap.newKeySet() or CopyOnWriteArrayList for thread-safe subscriber storage.
- Decouple publishing from subscriber notification using a DeliveryPolicy interface.
- Support automatic topic creation on first publish to simplify producer ergonomics.
coaching:
  presentationTips:
  - Clarify delivery semantics: at-least-once versus broadcast fanout.
  - Discuss concurrency protection when messages are published while subscribers dynamically join or leave.
  - Explain how separating the TopicManager from the MessageBroker respects the Single Responsibility Principle.
  commonMistakes:
  - Allowing unhandled subscriber exceptions to halt delivery to subsequent subscribers in the fanout loop.
  - Using non-thread-safe ArrayList collections for message and subscriber buffers under concurrent workload.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>pubsub</artifactId>
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
    # Publish-Subscribe Message Broker

    ## Overview
    Implement an in-memory, concurrent Publish-Subscribe (Pub/Sub) message broker supporting dynamic topic registration, multi-subscriber fanout delivery, decoupled message policies, and unsubscription lifecycles.

    ## Key Components
    - `com.interviewos.pubsub.service.MessageBroker`: Core message broker coordinating topics and dispatching publications.
    - `com.interviewos.pubsub.service.TopicManager`: Registry monitoring topic counts, subscriber counts, and deletion lifecycles.
    - `com.interviewos.pubsub.subscriber.Subscriber`: Consumer interface receiving published events.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/pubsub/service/MessageBroker.java`
    2. `src/main/java/com/interviewos/pubsub/service/TopicManager.java`
  src/main/java/com/interviewos/pubsub/model/Message.java: |
    package com.interviewos.pubsub.model;

    import java.time.Instant;

    public class Message {
        private final String id;
        private final String topic;
        private final String payload;
        private final Instant timestamp;

        public Message(String id, String topic, String payload) {
            this(id, topic, payload, Instant.now());
        }

        public Message(String id, String topic, String payload, Instant timestamp) {
            this.id = id;
            this.topic = topic;
            this.payload = payload;
            this.timestamp = timestamp != null ? timestamp : Instant.now();
        }

        public String getId() { return id; }
        public String getTopic() { return topic; }
        public String getPayload() { return payload; }
        public Instant getTimestamp() { return timestamp; }
    }
  src/main/java/com/interviewos/pubsub/model/SubscriptionType.java: |
    package com.interviewos.pubsub.model;

    public enum SubscriptionType {
        BROADCAST,
        DIRECT
    }
  src/main/java/com/interviewos/pubsub/model/Topic.java: |
    package com.interviewos.pubsub.model;

    import com.interviewos.pubsub.subscriber.Subscriber;

    import java.util.ArrayList;
    import java.util.List;
    import java.util.Set;
    import java.util.concurrent.ConcurrentHashMap;
    import java.util.concurrent.CopyOnWriteArrayList;

    public class Topic {
        private final String name;
        private final List<Message> messageLog = new CopyOnWriteArrayList<>();
        private final Set<Subscriber> subscribers = ConcurrentHashMap.newKeySet();

        public Topic(String name) {
            this.name = name;
        }

        public String getName() {
            return name;
        }

        public void addMessage(Message message) {
            if (message != null) {
                messageLog.add(message);
            }
        }

        public List<Message> getMessages() {
            return new ArrayList<>(messageLog);
        }

        public boolean addSubscriber(Subscriber subscriber) {
            if (subscriber == null) return false;
            return subscribers.add(subscriber);
        }

        public boolean removeSubscriber(Subscriber subscriber) {
            return subscribers.remove(subscriber);
        }

        public List<Subscriber> getSubscribers() {
            return new ArrayList<>(subscribers);
        }

        public int getSubscriberCount() {
            return subscribers.size();
        }
    }
  src/main/java/com/interviewos/pubsub/subscriber/Subscriber.java: |
    package com.interviewos.pubsub.subscriber;

    import com.interviewos.pubsub.model.Message;
    import java.util.List;

    public interface Subscriber {
        String getId();
        void onMessage(Message message);
        List<Message> getReceivedMessages();
    }
  src/main/java/com/interviewos/pubsub/subscriber/SimpleSubscriber.java: |
    package com.interviewos.pubsub.subscriber;

    import com.interviewos.pubsub.model.Message;

    import java.util.ArrayList;
    import java.util.List;
    import java.util.concurrent.CopyOnWriteArrayList;

    public class SimpleSubscriber implements Subscriber {
        private final String id;
        private final List<Message> received = new CopyOnWriteArrayList<>();

        public SimpleSubscriber(String id) {
            this.id = id;
        }

        @Override
        public String getId() {
            return id;
        }

        @Override
        public void onMessage(Message message) {
            if (message != null) {
                received.add(message);
            }
        }

        @Override
        public List<Message> getReceivedMessages() {
            return new ArrayList<>(received);
        }
    }
  src/main/java/com/interviewos/pubsub/policy/DeliveryPolicy.java: |
    package com.interviewos.pubsub.policy;

    import com.interviewos.pubsub.model.Message;
    import com.interviewos.pubsub.model.Topic;

    public interface DeliveryPolicy {
        void deliver(Topic topic, Message message);
    }
  src/main/java/com/interviewos/pubsub/policy/BroadcastDeliveryPolicy.java: |
    package com.interviewos.pubsub.policy;

    import com.interviewos.pubsub.model.Message;
    import com.interviewos.pubsub.model.Topic;
    import com.interviewos.pubsub.subscriber.Subscriber;

    public class BroadcastDeliveryPolicy implements DeliveryPolicy {
        @Override
        public void deliver(Topic topic, Message message) {
            if (topic == null || message == null) return;
            for (Subscriber sub : topic.getSubscribers()) {
                sub.onMessage(message);
            }
        }
    }
  src/main/java/com/interviewos/pubsub/service/MessageBroker.java: |
    package com.interviewos.pubsub.service;

    import com.interviewos.pubsub.model.Message;
    import com.interviewos.pubsub.model.Topic;
    import com.interviewos.pubsub.policy.BroadcastDeliveryPolicy;
    import com.interviewos.pubsub.policy.DeliveryPolicy;
    import com.interviewos.pubsub.subscriber.Subscriber;

    import java.util.Map;
    import java.util.UUID;
    import java.util.concurrent.ConcurrentHashMap;

    public class MessageBroker {
        private final Map<String, Topic> topics = new ConcurrentHashMap<>();
        private final DeliveryPolicy deliveryPolicy;

        public MessageBroker() {
            this(new BroadcastDeliveryPolicy());
        }

        public MessageBroker(DeliveryPolicy deliveryPolicy) {
            this.deliveryPolicy = deliveryPolicy != null ? deliveryPolicy : new BroadcastDeliveryPolicy();
        }

        public Topic createTopic(String topicName) {
            // TODO: Compute and store Topic if absent, return Topic instance
            throw new UnsupportedOperationException("TODO: Implement MessageBroker.createTopic");
        }

        public boolean subscribe(String topicName, Subscriber subscriber) {
            // TODO: Find topic (or create if absent) and register subscriber
            throw new UnsupportedOperationException("TODO: Implement MessageBroker.subscribe");
        }

        public boolean unsubscribe(String topicName, Subscriber subscriber) {
            // TODO: Find topic and remove subscriber
            throw new UnsupportedOperationException("TODO: Implement MessageBroker.unsubscribe");
        }

        public void publish(String topicName, String payload) {
            // TODO: Ensure topic exists, instantiate Message, record in topic, and dispatch via deliveryPolicy
            throw new UnsupportedOperationException("TODO: Implement MessageBroker.publish");
        }

        public int getMessageCount(String topicName) {
            // TODO: Return count of messages recorded on topic
            throw new UnsupportedOperationException("TODO: Implement MessageBroker.getMessageCount");
        }

        public Topic getTopic(String topicName) {
            return topics.get(topicName);
        }

        public Map<String, Topic> getTopics() {
            return topics;
        }
    }
  src/main/java/com/interviewos/pubsub/service/TopicManager.java: |
    package com.interviewos.pubsub.service;

    import com.interviewos.pubsub.model.Topic;

    import java.util.Set;

    public class TopicManager {
        private final MessageBroker broker;

        public TopicManager(MessageBroker broker) {
            this.broker = broker != null ? broker : new MessageBroker();
        }

        public MessageBroker getBroker() {
            return broker;
        }

        public boolean topicExists(String topicName) {
            // TODO: Check if topic exists in broker
            throw new UnsupportedOperationException("TODO: Implement TopicManager.topicExists");
        }

        public int getSubscriberCount(String topicName) {
            // TODO: Query subscriber count from topic in broker
            throw new UnsupportedOperationException("TODO: Implement TopicManager.getSubscriberCount");
        }

        public boolean deleteTopic(String topicName) {
            // TODO: Remove topic from broker
            throw new UnsupportedOperationException("TODO: Implement TopicManager.deleteTopic");
        }

        public Set<String> getAllTopicNames() {
            // TODO: Return set of active topic names in broker
            throw new UnsupportedOperationException("TODO: Implement TopicManager.getAllTopicNames");
        }
    }
  src/test/java/com/interviewos/pubsub/PubSubTopicLifecycleTest.java: |
    package com.interviewos.pubsub;

    import com.interviewos.pubsub.model.Topic;
    import com.interviewos.pubsub.service.MessageBroker;
    import com.interviewos.pubsub.service.TopicManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class PubSubTopicLifecycleTest {

        @Test
        @DisplayName("createTopic registers topic and returns idempotent instance")
        void testTopicCreationIdempotency() {
            MessageBroker broker = new MessageBroker();
            Topic t1 = broker.createTopic("orders");
            Topic t2 = broker.createTopic("orders");

            assertNotNull(t1);
            assertSame(t1, t2, "Repeated createTopic calls for identical name must return identical Topic");
        }

        @Test
        @DisplayName("TopicManager deletes topic cleanly from broker")
        void testTopicDeletion() {
            MessageBroker broker = new MessageBroker();
            broker.createTopic("payments");
            TopicManager manager = new TopicManager(broker);

            assertTrue(manager.topicExists("payments"));
            boolean deleted = manager.deleteTopic("payments");
            assertTrue(deleted);
            assertFalse(manager.topicExists("payments"));
        }
    }
  src/test/java/com/interviewos/pubsub/PubSubMessagePublishTest.java: |
    package com.interviewos.pubsub;

    import com.interviewos.pubsub.model.Topic;
    import com.interviewos.pubsub.service.MessageBroker;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class PubSubMessagePublishTest {

        @Test
        @DisplayName("publish appends message to topic log with unique identifier")
        void testPublishRecordsMessage() {
            MessageBroker broker = new MessageBroker();
            broker.createTopic("telemetry");
            broker.publish("telemetry", "metric-a=42");

            assertEquals(1, broker.getMessageCount("telemetry"));
            Topic topic = broker.getTopic("telemetry");
            assertNotNull(topic.getMessages().get(0).getId());
            assertEquals("metric-a=42", topic.getMessages().get(0).getPayload());
        }

        @Test
        @DisplayName("Publishing to new topic automatically registers topic and logs message")
        void testPublishAutoCreatesTopic() {
            MessageBroker broker = new MessageBroker();
            broker.publish("notifications", "Welcome user 99");

            assertEquals(1, broker.getMessageCount("notifications"));
        }
    }
  src/test/java/com/interviewos/pubsub/PubSubSubscriberDeliveryTest.java: |
    package com.interviewos.pubsub;

    import com.interviewos.pubsub.model.Message;
    import com.interviewos.pubsub.service.MessageBroker;
    import com.interviewos.pubsub.subscriber.SimpleSubscriber;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class PubSubSubscriberDeliveryTest {

        @Test
        @DisplayName("All subscribed consumers receive published event")
        void testFanoutDelivery() {
            MessageBroker broker = new MessageBroker();
            SimpleSubscriber sub1 = new SimpleSubscriber("sub-1");
            SimpleSubscriber sub2 = new SimpleSubscriber("sub-2");

            broker.subscribe("news", sub1);
            broker.subscribe("news", sub2);
            broker.publish("news", "Breaking News 1");

            List<Message> m1 = sub1.getReceivedMessages();
            List<Message> m2 = sub2.getReceivedMessages();

            assertEquals(1, m1.size());
            assertEquals(1, m2.size());
            assertEquals("Breaking News 1", m1.get(0).getPayload());
            assertEquals("Breaking News 1", m2.get(0).getPayload());
        }

        @Test
        @DisplayName("Unsubscribed consumer ceases receiving subsequent messages")
        void testUnsubscribeLifecycle() {
            MessageBroker broker = new MessageBroker();
            SimpleSubscriber sub = new SimpleSubscriber("sub-temp");

            broker.subscribe("updates", sub);
            broker.publish("updates", "Update 1");
            broker.unsubscribe("updates", sub);
            broker.publish("updates", "Update 2");

            assertEquals(1, sub.getReceivedMessages().size());
            assertEquals("Update 1", sub.getReceivedMessages().get(0).getPayload());
            assertEquals(2, broker.getMessageCount("updates"));
        }
    }
editablePaths:
- src/main/java/com/interviewos/pubsub/service/MessageBroker.java
- src/main/java/com/interviewos/pubsub/service/TopicManager.java
hiddenTestFiles:
  src/test/java/com/interviewos/pubsub/PubSubTopicLifecycleTest.java: |
    package com.interviewos.pubsub;

    import com.interviewos.pubsub.model.Topic;
    import com.interviewos.pubsub.service.MessageBroker;
    import com.interviewos.pubsub.service.TopicManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class PubSubTopicLifecycleTest {

        @Test
        @DisplayName("createTopic registers topic and returns idempotent instance")
        void testTopicCreationIdempotency() {
            MessageBroker broker = new MessageBroker();
            Topic t1 = broker.createTopic("orders");
            Topic t2 = broker.createTopic("orders");

            assertNotNull(t1);
            assertSame(t1, t2, "Repeated createTopic calls for identical name must return identical Topic");
        }

        @Test
        @DisplayName("TopicManager deletes topic cleanly from broker")
        void testTopicDeletion() {
            MessageBroker broker = new MessageBroker();
            broker.createTopic("payments");
            TopicManager manager = new TopicManager(broker);

            assertTrue(manager.topicExists("payments"));
            boolean deleted = manager.deleteTopic("payments");
            assertTrue(deleted);
            assertFalse(manager.topicExists("payments"));
        }
    }
  src/test/java/com/interviewos/pubsub/PubSubMessagePublishTest.java: |
    package com.interviewos.pubsub;

    import com.interviewos.pubsub.model.Topic;
    import com.interviewos.pubsub.service.MessageBroker;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class PubSubMessagePublishTest {

        @Test
        @DisplayName("publish appends message to topic log with unique identifier")
        void testPublishRecordsMessage() {
            MessageBroker broker = new MessageBroker();
            broker.createTopic("telemetry");
            broker.publish("telemetry", "metric-a=42");

            assertEquals(1, broker.getMessageCount("telemetry"));
            Topic topic = broker.getTopic("telemetry");
            assertNotNull(topic.getMessages().get(0).getId());
            assertEquals("metric-a=42", topic.getMessages().get(0).getPayload());
        }

        @Test
        @DisplayName("Publishing to new topic automatically registers topic and logs message")
        void testPublishAutoCreatesTopic() {
            MessageBroker broker = new MessageBroker();
            broker.publish("notifications", "Welcome user 99");

            assertEquals(1, broker.getMessageCount("notifications"));
        }
    }
  src/test/java/com/interviewos/pubsub/PubSubSubscriberDeliveryTest.java: |
    package com.interviewos.pubsub;

    import com.interviewos.pubsub.model.Message;
    import com.interviewos.pubsub.service.MessageBroker;
    import com.interviewos.pubsub.subscriber.SimpleSubscriber;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class PubSubSubscriberDeliveryTest {

        @Test
        @DisplayName("All subscribed consumers receive published event")
        void testFanoutDelivery() {
            MessageBroker broker = new MessageBroker();
            SimpleSubscriber sub1 = new SimpleSubscriber("sub-1");
            SimpleSubscriber sub2 = new SimpleSubscriber("sub-2");

            broker.subscribe("news", sub1);
            broker.subscribe("news", sub2);
            broker.publish("news", "Breaking News 1");

            List<Message> m1 = sub1.getReceivedMessages();
            List<Message> m2 = sub2.getReceivedMessages();

            assertEquals(1, m1.size());
            assertEquals(1, m2.size());
            assertEquals("Breaking News 1", m1.get(0).getPayload());
            assertEquals("Breaking News 1", m2.get(0).getPayload());
        }

        @Test
        @DisplayName("Unsubscribed consumer ceases receiving subsequent messages")
        void testUnsubscribeLifecycle() {
            MessageBroker broker = new MessageBroker();
            SimpleSubscriber sub = new SimpleSubscriber("sub-temp");

            broker.subscribe("updates", sub);
            broker.publish("updates", "Update 1");
            broker.unsubscribe("updates", sub);
            broker.publish("updates", "Update 2");

            assertEquals(1, sub.getReceivedMessages().size());
            assertEquals("Update 1", sub.getReceivedMessages().get(0).getPayload());
            assertEquals(2, broker.getMessageCount("updates"));
        }
    }
starterCode: |
  package com.interviewos.pubsub.service;

  import com.interviewos.pubsub.model.Message;
  import com.interviewos.pubsub.model.Topic;
  import com.interviewos.pubsub.policy.BroadcastDeliveryPolicy;
  import com.interviewos.pubsub.policy.DeliveryPolicy;
  import com.interviewos.pubsub.subscriber.Subscriber;

  import java.util.Map;
  import java.util.UUID;
  import java.util.concurrent.ConcurrentHashMap;

  public class MessageBroker {
      private final Map<String, Topic> topics = new ConcurrentHashMap<>();
      private final DeliveryPolicy deliveryPolicy;

      public MessageBroker() {
          this(new BroadcastDeliveryPolicy());
      }

      public MessageBroker(DeliveryPolicy deliveryPolicy) {
          this.deliveryPolicy = deliveryPolicy != null ? deliveryPolicy : new BroadcastDeliveryPolicy();
      }

      public Topic createTopic(String topicName) {
          // TODO: Compute and store Topic if absent, return Topic instance
          throw new UnsupportedOperationException("TODO: Implement MessageBroker.createTopic");
      }

      public boolean subscribe(String topicName, Subscriber subscriber) {
          // TODO: Find topic (or create if absent) and register subscriber
          throw new UnsupportedOperationException("TODO: Implement MessageBroker.subscribe");
      }

      public boolean unsubscribe(String topicName, Subscriber subscriber) {
          // TODO: Find topic and remove subscriber
          throw new UnsupportedOperationException("TODO: Implement MessageBroker.unsubscribe");
      }

      public void publish(String topicName, String payload) {
          // TODO: Ensure topic exists, instantiate Message, record in topic, and dispatch via deliveryPolicy
          throw new UnsupportedOperationException("TODO: Implement MessageBroker.publish");
      }

      public int getMessageCount(String topicName) {
          // TODO: Return count of messages recorded on topic
          throw new UnsupportedOperationException("TODO: Implement MessageBroker.getMessageCount");
      }

      public Topic getTopic(String topicName) {
          return topics.get(topicName);
      }

      public Map<String, Topic> getTopics() {
          return topics;
      }
  }
solutionCode: |
  package com.interviewos.pubsub.service;

  import com.interviewos.pubsub.model.Message;
  import com.interviewos.pubsub.model.Topic;
  import com.interviewos.pubsub.policy.BroadcastDeliveryPolicy;
  import com.interviewos.pubsub.policy.DeliveryPolicy;
  import com.interviewos.pubsub.subscriber.Subscriber;

  import java.util.Map;
  import java.util.UUID;
  import java.util.concurrent.ConcurrentHashMap;

  public class MessageBroker {
      private final Map<String, Topic> topics = new ConcurrentHashMap<>();
      private final DeliveryPolicy deliveryPolicy;

      public MessageBroker() {
          this(new BroadcastDeliveryPolicy());
      }

      public MessageBroker(DeliveryPolicy deliveryPolicy) {
          this.deliveryPolicy = deliveryPolicy != null ? deliveryPolicy : new BroadcastDeliveryPolicy();
      }

      public Topic createTopic(String topicName) {
          return topics.computeIfAbsent(topicName, Topic::new);
      }

      public boolean subscribe(String topicName, Subscriber subscriber) {
          Topic topic = createTopic(topicName);
          return topic.addSubscriber(subscriber);
      }

      public boolean unsubscribe(String topicName, Subscriber subscriber) {
          Topic topic = topics.get(topicName);
          if (topic == null) return false;
          return topic.removeSubscriber(subscriber);
      }

      public void publish(String topicName, String payload) {
          Topic topic = createTopic(topicName);
          String id = "MSG-" + UUID.randomUUID().toString().substring(0, 8);
          Message msg = new Message(id, topicName, payload);
          topic.addMessage(msg);
          deliveryPolicy.deliver(topic, msg);
      }

      public int getMessageCount(String topicName) {
          Topic topic = topics.get(topicName);
          return topic != null ? topic.getMessages().size() : 0;
      }

      public Topic getTopic(String topicName) {
          return topics.get(topicName);
      }

      public Map<String, Topic> getTopics() {
          return topics;
      }
  }
---

### Problem Statement: Publish-Subscribe Message Broker

You are tasked with designing and implementing an in-memory, highly concurrent Publish-Subscribe (Pub/Sub) message broker in Java. Modern cloud platforms and microservice architectures rely on message brokers to decouple producer services from consumer workflows, ensuring asynchronous event dissemination and high fault isolation. Your goal is to architect a thread-safe broker that manages message topics, supports dynamic subscriber onboarding and offboarding, applies flexible fanout delivery policies, and retains topic event logs.

#### Functional Requirements:
1. **Topic Lifecycle Management**: Support idempotent topic registration and clean topic removal without throwing unhandled concurrency exceptions.
2. **Topic Message Append**: Record every published message sequentially into an immutable topic log with a globally unique identifier and timestamp.
3. **Decoupled Consumer Subscriptions**: Provide a Subscriber interface allowing heterogeneous clients to subscribe to and unsubscribe from named topics.
4. **Broadcast Fanout Delivery**: Implement a DeliveryPolicy strategy (such as BroadcastDeliveryPolicy) that delivers emitted messages to all active subscribers registered for that topic.
5. **Dynamic Subscription Modification**: Ensure that adding or removing subscribers while messages are actively being published does not cause race conditions or ConcurrentModificationException errors.
6. **Auto-Topic Registration**: When publishing to a topic that has not yet been explicitly created, initialize the topic safely and complete the publish operation.
7. **Broker Query Metrics**: Expose lookup methods to retrieve the count of messages stored on a topic and inspect registered topic entities.
8. **Topic Manager Administration**: Provide an administrative TopicManager coordinator capable of querying topic existence, subscriber counts, and deleting existing topics.

#### Non-goals:
- Durable disk persistence, WAL (write-ahead log) recovery segments, and crash recovery across JVM restarts are omitted for this in-memory broker engine.
- Partitioning, distributed consumer group rebalancing, and consumer offset commits are deferred to enterprise distributed streaming systems.
