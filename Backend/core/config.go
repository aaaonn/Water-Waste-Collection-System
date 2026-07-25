package core

import (
	"log"
	"github.com/joho/godotenv"
)

func LoadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	} else {
		log.Println("Environment variables loaded successfully from .env file")
	}
}