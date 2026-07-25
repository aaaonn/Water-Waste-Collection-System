package middleware

import (
	"net/http"
	"os" // ✅ 1. เพิ่ม import os เพื่ออ่านค่าจาก .env
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JwtClaims คือข้อมูลที่เราจะ "ยัดไส้" เข้าไปใน Token
type JwtClaims struct {
	UserID        uint   `json:"id"`
	SubdistrictID uint   `json:"subdistrict_id"`
	Username      string `json:"username"`
	Role          string `json:"role"`
	jwt.RegisteredClaims
}


// AuthMiddleware คือยามตรวจ Token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. ดึง Token (เน้นหาจาก Header ก่อน)
		tokenString := ""
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			// รองรับทั้ง Bearer <token> (มีวรรค) และ Bearer<token> (ไม่มีวรรค) เพื่อความยืดหยุ่น
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			tokenString = strings.TrimPrefix(tokenString, "Bearer")
			tokenString = strings.TrimSpace(tokenString)
		} else {
			// ถ้าไม่มีใน Header ค่อยไปหาใน Cookie (เผื่อไว้)
			tokenString, _ = c.Cookie("auth-token")
			if tokenString == "" {
				// เผื่อส่งผ่าน query string สำหรับการเชื่อมต่ออย่าง SSE หรือ WebSocket
				tokenString = c.Query("token")
			}
		}

		// 2. ถ้าไม่มี Token เลย -> ไล่กลับบ้าน
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: No token found"})
			c.Abort()
			return
		}

		// 3. ตรวจสอบลายเซ็น Token
		// ✅ แก้ตรงนี้: อ่าน Secret จาก Environment Variable แทนการ Hardcode
		secret := os.Getenv("JWT_SECRET_KEY")
		if secret == "" {
			secret = "secret1234" // ค่าสำรอง (Fallback) กรณีลืมตั้งใน .env
		}
		jwtSecret := []byte(secret)

		token, err := jwt.ParseWithClaims(tokenString, &JwtClaims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		// 4. ถ้า Token ปลอม หรือ หมดอายุ
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Invalid token"})
			c.Abort()
			return
		}

		// 5. ดึงข้อมูลจาก Token มาเก็บไว้ใน Context
		if claims, ok := token.Claims.(*JwtClaims); ok && token.Valid {
			// ✅ ใช้ชื่อ "user_id" และ "role_id" เพื่อให้ตรงกับ Controller
			c.Set("user_id", claims.UserID)
			c.Set("role", claims.Role)
			c.Set("role_id", uint(0)) // fallback เผื่อไว้
			c.Set("subdistrict_id", claims.SubdistrictID)
		}

		c.Next()
	}
}