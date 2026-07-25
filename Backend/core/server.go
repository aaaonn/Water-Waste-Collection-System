package core

import (
	"log"

	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func RunServer() {
	router := gin.Default()

	router.Use(middleware.CORSMiddleware())

	log.Println("Starting server on port 8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
