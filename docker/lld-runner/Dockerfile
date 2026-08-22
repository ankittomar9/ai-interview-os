FROM maven:3.9-eclipse-temurin-21

LABEL maintainer="ai-interview-os"
LABEL description="Pre-warmed isolated container runner for Spring Boot 3.4 / JUnit 5 LLD evaluation"

WORKDIR /tmp/warm

COPY skeleton-pom.xml /tmp/warm/pom.xml

# Pre-fetch all dependencies and plugins to populate local ~/.m2 offline repository cache
RUN mvn -B -q dependency:go-offline || true

WORKDIR /workspace

CMD ["mvn", "-o", "-B", "test"]
