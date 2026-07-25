// package middleware

// import (
// 	"net/http"
// 	"github.com/gin-gonic/gin"
// )

// func CORSMiddleware() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		origin := c.Request.Header.Get("Origin")
		
// 		// ป้องกันการชนกันของ "*" และ "Credentials: true" ด้วยการสะท้อน Origin กลับไปแบบ Dynamic
// 		if origin != "" {
// 			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
// 			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
// 		} else {
// 			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
// 		}

// 		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		
// 		// อนุญาต Header ที่ร้องขอมาใน Preflight โดยอัตโนมัติ เพื่อรองรับความเข้ากันได้สูง
// 		reqHeaders := c.Request.Header.Get("Access-Control-Request-Headers")
// 		if reqHeaders != "" {
// 			c.Writer.Header().Set("Access-Control-Allow-Headers", reqHeaders)
// 		} else {
// 			c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, Accept, X-Requested-With, X-Requester-Role")
// 		}

// 		if c.Request.Method == "OPTIONS" {
// 			c.AbortWithStatus(http.StatusNoContent)
// 			return
// 		}

// 		c.Next()
// 	}
// }

package middleware

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
	// 🔒 กำหนดโดเมนที่อนุญาตจริงๆ เท่านั้น (เพิ่มโดเมน localhost สำหรับตอน dev ได้)
	allowedOrigins := map[string]bool{
		"https://frontend-v1-1xej.onrender.com": true,
		"http://localhost:3000":                 true, // เผื่อรันเทสในเครื่องตัวเอง
		"https://frontend-v2-v2.onrender.com":   true,
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if origin != "" {
			// ตรวจสอบว่า Origin ที่ยิงมา อยู่ในลิสต์ที่เราอนุญาตไหม
			if allowedOrigins[origin] {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			} else {
				// ถ้าไม่อยู่ในลิสต์ แต่อยากให้เข้าถึงได้แบบจำกัด (ไม่ส่ง Credential) 
				// หรือจะเลือกไม่ใส่ Header เลยเพื่อให้เบราว์เซอร์บล็อกไปเลยก็ได้
				c.Writer.Header().Set("Access-Control-Allow-Origin", "null")
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

		reqHeaders := c.Request.Header.Get("Access-Control-Request-Headers")
		if reqHeaders != "" {
			c.Writer.Header().Set("Access-Control-Allow-Headers", reqHeaders)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, Accept, X-Requested-With, X-Requester-Role")
		}

		// 🛠️ ปรับปรุงการส่งกลับสำหรับคำขอ OPTIONS (Preflight)
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent) // พ่น 204 และหยุด Middleware ตัวอื่น
			return
		}

		c.Next()
	}
}