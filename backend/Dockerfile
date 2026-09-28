# ============ BUILD STAGE ============
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

COPY pom.xml .

RUN mvn dependency:go-offline -DdownloadSources=false

COPY src ./src

RUN mvn clean package -DskipTests

# ============ PRODUCTION STAGE ============
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init curl

# Copy JAR from builder
COPY --from=builder /build/target/*.jar app.jar

# Create non-root user
RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001

USER spring

EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8081/api/auth/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["java", "-jar", "app.jar"]