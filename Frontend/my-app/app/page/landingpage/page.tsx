"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const logoSrc = ""; // ใส่ URL หรือ path ของโลโก้ตรงนี้ เช่น "/logo.png"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = "http://localhost:8080/api";
      // const apiUrl = "https://backend-v1-m7fk.onrender.com/api";
      const res = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }

      const data = await res.json();

      // บันทึกใน localStorage (สำหรับ httpClient)
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      if (data.name) {
        localStorage.setItem("name", data.name);
      }

      // บันทึกใน Cookie (สำหรับ Next.js Middleware)
      document.cookie = `auth_token=${data.token}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `role=${data.role}; path=/; max-age=3600; SameSite=Lax`;

      // Redirect ไปหน้าของแต่ละ Role (ต้องระบุ /page/ เนื่องจากโครงสร้างหน้าเว็บบังคับ)
      if (data.role === "super_admin") {
        router.push("/page/super_admin/organization_management");
      } else if (data.role === "admin" || data.role === "staff") {
        router.push(`/page/${data.role}/dashboard`);
      } else if (data.role === "household") {
        router.push("/page/household/dashboard");
      } else {
        setError("ไม่พบบทบาทผู้ใช้งานที่ถูกต้อง");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#d1e4ff] to-[#e6f0ff] px-4 font-sans overflow-hidden">
      
      {/* แสงเอฟเฟกต์สีเหลืองฟุ้งบริเวณมุมขวาบนตามภาพต้นฉบับ */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#fff5cc] rounded-full blur-[80px] opacity-60 pointer-events-none" />

      {/* กล่องเนื้อหาหลัก */}
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        
        {/* โลโก้ อบต.ทุ่งหลวง (สามารถเปลี่ยน src เป็น path รูปจริงของคุณได้เลย) */}
        <div className="w-40 h-40 mb-6 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-white/20 overflow-hidden">
          {logoSrc ? (
            <img 
              src={logoSrc}
              alt="โลโก้" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-500 font-medium text-lg select-none">โลโก้</span>
          )}
        </div>

        {/* ส่วนหัวข้อข้อความ */}
        <div className="text-center mb-10">
          <p className="text-xs text-gray-500 tracking-widest uppercase mb-1">
            องค์การบริหารส่วนตำบล
          </p>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            ระบบจัดเก็บค่าน้ำและค่าขยะ
          </h1>
          <p className="text-[10px] text-gray-400 tracking-wider uppercase">
            Subdistrict Administrative Organization
          </p>
        </div>

        {/* ฟอร์มเข้าสู่ระบบ */}
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-1">
            เข้าสู่ระบบ
          </h2>
          <p className="text-[11px] text-center text-gray-400 mb-8">
            กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบบริหารจัดการ
          </p>

          {/* ช่องกรอก ชื่อผู้ใช้ */}
          <div className="mb-6">
            <label className="block text-base font-bold text-gray-800 mb-1">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ระบุชื่อผู้ใช้"
              className="w-full bg-transparent border-b border-gray-600 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* ช่องกรอก รหัสผ่าน */}
          <div className="mb-10">
            <label className="block text-base font-bold text-gray-800 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ระบุรหัสผ่าน"
              className="w-full bg-transparent border-b border-gray-600 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* ส่วนแสดงข้อความแจ้งเตือนข้อผิดพลาด */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3 mb-4 font-medium text-center">
              {error}
            </div>
          )}

          {/* ปุ่มเข้าสู่ระบบ */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e1e1e] hover:bg-black text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-md text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ"}
          </button>
        </form>

      </div>
    </div>
  );
}