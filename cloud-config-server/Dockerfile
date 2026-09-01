FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY cloud-config-server/target/*.jar app.jar
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
