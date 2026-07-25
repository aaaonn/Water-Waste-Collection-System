package utils

import (
	"os"
	"time"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	ID           int    `json:"id"`
	Username     string `json:"username"`
	SubdistrictID int   `json:"subdistrict_id"`
	Role         string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateJWT(ID int, username string, subdistrictID int, role string) (string, error) {
	secret := os.Getenv("JWT_SECRET_KEY")
	if secret == "" {
		secret = "secret1234" // Fallback matching middleware
	}
	jwtKey := []byte(secret)
	
	// อ่านค่าระยะเวลาหมดอายุจาก .env (เช่น "1h", "24h")
	expirationStr := os.Getenv("JWT_EXPIRATION_DURATION")
	if expirationStr == "" {
		expirationStr = "24h" // ค่าเริ่มต้นกรณีไม่มีการตั้งค่า
	}

	// แปลงข้อความเป็นประเภท time.Duration (เช่น "1h" -> 1 ชั่วโมง)
	expirationDuration, err := time.ParseDuration(expirationStr)
	if err != nil {
		expirationDuration = 24 * time.Hour // ป้องกันความเสียหายในกรณีใส่รูปแบบผิด
	}
	
	expirationTime := time.Now().Add(expirationDuration)

	claims := &Claims{
		ID:           ID,
		Username:     username,
		SubdistrictID: subdistrictID,
		Role:         role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}