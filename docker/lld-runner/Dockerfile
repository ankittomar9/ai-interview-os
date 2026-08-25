FROM maven:3.9-eclipse-temurin-21

LABEL maintainer="ai-interview-os"
LABEL description="Pre-warmed isolated container runner for Spring Boot 3.4 / JUnit 5 LLD evaluation"

WORKDIR /tmp/warm

COPY skeleton-pom.xml /tmp/warm/pom.xml
COPY src /tmp/warm/src

# Pre-fetch all dependencies, plugins, and execute test phase to fully warm ~/.m2
RUN mvn -B dependency:go-offline dependency:resolve-plugins &&     mvn -B test &&     rm -rf /tmp/warm

WORKDIR /workspace

CMD ["mvn", "-o", "-B", "test"]
