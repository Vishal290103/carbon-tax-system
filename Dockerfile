# Build stage
FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
# Copy the pom and src from the subfolder
COPY "major back/pom.xml" ./
RUN mvn dependency:go-offline
COPY "major back/src" ./src
RUN mvn package -DskipTests

# Run stage
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
# Set the port to 8081 as per your properties
ENTRYPOINT ["java", "-Xmx300m", "-jar", "app.jar"]
