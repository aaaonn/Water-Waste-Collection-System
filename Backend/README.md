# go set up
    go tidy
    go run main.go


# flie struct
main.go

midlewere
    -auth.go
    -cors.go
core
    -config.go  <--load .evn and setting-->
    -database.go   <-- connect databast->
    -server.go  <--run server-->

controller
    -controllername
        --handler.go
        --service.go
        --repository.go
        --schema.go
entity
router.go





# อ่านก่อนทำ 

controller -> web controller
mobile_controller -> mobile controller

>การเขียน controller เขียนแบบ N-Tier Architecture
    คือเขียนแยก Layer
    handler ส่วนติดต่อกับ frontend รับ ส่งข้อมูล
    service ส่วนประมวนผล คำนวน หรืออื่นๆ
    repository คือส่วนติดต่อกับ database เพิ่ม ลบ แก้ไข้ ข้อมูลในฐานข้อมูล

>ขั้นตอนการเขียน controller 
    1. เขียน controller ทั้ง 3 Layer
    2. เพิ่ม handler ใน backend/core/container (ข้างในมีตัวอย่าง)
    3. เพิ่ม router ในส่วนของระบบนั้น มี comment ขั้น

>สร้างไฟล์ .env ก่อน run
    JWT_SECRET_KEY="secret_key"
    DB_HOST=localhost   
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=รหัส postgres
    DB_NAME=capstone_db
    DB_SSLMODE=disable
