package main

import (
	"backend/core"
	"backend/middleware"
	"backend/router"

	"github.com/gin-gonic/gin"
)

func main() {

	// ส่วนรันเซิร์ฟเวอร์หลัก
	core.LoadEnv()
	db := core.ConnectDatabase()
	// core.RunServer()

	// ส่วนรัน api
	r := gin.Default()
	r.Use(middleware.CORSMiddleware())
	container := core.NewAppContainer(db)
	router.SetupRoutes(r, container)
	r.Run(":8080")

}
