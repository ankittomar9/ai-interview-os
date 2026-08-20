FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY service-discovery-service/pom.xml ./service-discovery-service/
COPY cloud-config-server/pom.xml ./cloud-config-server/
COPY api-gateway-service/pom.xml ./api-gateway-service/
COPY interview-session-service/pom.xml ./interview-session-service/
COPY ai-orchestrator-service/pom.xml ./ai-orchestrator-service/
COPY proctor-sentinel-service/pom.xml ./proctor-sentinel-service/
COPY evaluation-report-service/pom.xml ./evaluation-report-service/
COPY cloud-config-server/src ./cloud-config-server/src
RUN mvn -B clean package -pl cloud-config-server -am -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/cloud-config-server/target/*.jar app.jar
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]