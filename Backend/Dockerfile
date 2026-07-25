# Stage 1: Build the Go binary
FROM golang:alpine AS builder

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./

# Adjust the go version in go.mod inside the container to match the container's compiler version
RUN go mod edit -go=1.23

# Download modules
RUN go mod download

# Copy the entire backend source code
COPY . .

# Build the application binary for Linux container
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Stage 2: Run the binary in a lightweight image
FROM alpine:latest

WORKDIR /app

# Install tzdata for Thailand timezone or logging local times
RUN apk --no-cache add tzdata

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Expose Go Gin API port
EXPOSE 8080

# Command to execute backend application
CMD ["./main"]
