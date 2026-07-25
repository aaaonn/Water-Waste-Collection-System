# react set up
    npm install
    npm run dev


# frontend struct

app
    -globals.css
    -layout.tsx
    -page.tsx

    -page  สร้างแต่ละ page แยกกันใน folder นี้
        -- namepage
            ---component.tsx คอมโพเนน ที่ใช้เฉพาะใน page นี้
            ---page.tsx

    -components ใช้หลายระบบ
        --confirmbox.tsx

    -service
        --base_api.tsx
    
    -interfact