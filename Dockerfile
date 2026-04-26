# Build stage
FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
# Using JSON syntax for COPY to handle spaces in folder names correctly
COPY ["major back/pom.xml", "./"]
RUN mvn dependency:go-offline
COPY ["major back/src", "./src"]
RUN mvn package -DskipTests

# Run stage
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
# Using limited memory for Render Free Tier
ENTRYPOINT ["java", "-Xmx300m", "-jar", "app.jar"]
