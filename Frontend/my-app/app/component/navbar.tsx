"use client";



import { usePathname, useRouter } from "next/navigation";

import { useState, useRef, useEffect } from "react";

import { Menu } from "lucide-react";



interface NavbarProps {

  onToggleSidebar: () => void;

  isSidebarOpen: boolean;

}



export default function Navbar({ onToggleSidebar, isSidebarOpen }: NavbarProps) {

  const pathname = usePathname();

  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {

      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {

        setIsDropdownOpen(false);

      }

    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {

      document.removeEventListener("mousedown", handleClickOutside);

    };

  }, []);



  const handleLogout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("role");

    localStorage.removeItem("name");



    document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";

    document.cookie = "role=; path=/; max-age=0; SameSite=Lax";



    router.push("/");

  };



  const getRole = () => {

    if (pathname.includes("/page/household")) return "household";

    if (pathname.includes("/page/super_admin")) return "super_admin";

    if (pathname.includes("/page/admin")) return "admin";

    return "staffsubdistrict";

  };



  const role = getRole();



  const [userName, setUserName] = useState("กำลังโหลด...");



  useEffect(() => {

    if (typeof window !== "undefined") {

      const storedName = localStorage.getItem("name");

      if (storedName) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUserName(storedName);

      } else {

        setUserName("ผู้ใช้งานระบบ");

      }

    }

  }, []);



  const getPageTitle = () => {

    if (pathname.includes("/page/staffsubdistrict/users")) return "จัดการผู้ใช้";

    if (pathname.includes("/subdistrict_management/household")) return "จัดการครัวเรือน";

    if (pathname.includes("/subdistrict_management/villages")) return "จัดการหมู่บ้าน";

    if (pathname.includes("/subdistrict_management")) return "จัดการหมู่บ้าน";

    if (pathname.includes("/dashboard")) return "หน้าหลัก";

    if (pathname.includes("/reports")) return "รายงาน";

    if (pathname.includes("/payments")) return "รายการชำระเงิน";

    if (pathname.includes("/base_settings")) return "ตั้งค่าข้อมูลพื้นฐานค่าน้ำเเละค่าขยะ";

    if (pathname.includes("/organization_management")) return "จัดการองค์กร";

    if (pathname.includes("/payment")) return "ชำระค่าบริการ";

    if (pathname.includes("/history")) return "ประวัติการชำระเงิน";

    if (pathname.includes("/settings")) return "ตั้งค่าบัญชี";

    return "ระบบจัดการ อบต.";

  };



  const getUserInfo = () => {

    switch (role) {

      case "super_admin":

        return {

          name: userName,

          roleLabel: "SUPER ADMIN",

          avatarColor: "border-[#0C5AE9]"

        };

      case "admin":

        return {

          name: userName,

          roleLabel: "ADMIN",

          avatarColor: "border-[#0C5AE9]"

        };

      case "household":

        return {

          name: userName,

          roleLabel: "HOUSEHOLD",

          avatarColor: "border-[#0C5AE9]"

        };

      case "staffsubdistrict":

      default:

        return {

          name: userName,

          roleLabel: "STAFF SUBDISTRICT",

          avatarColor: "border-[#0C5AE9]"

        };

    }

  };



  const user = getUserInfo();



  return (

    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3 select-none shrink-0">

      <button

        type="button"

        onClick={onToggleSidebar}

        aria-label={isSidebarOpen ? "ปิดเมนู" : "เปิดเมนู"}

        aria-expanded={isSidebarOpen}

        className="p-2 -ml-1 rounded-xl hover:bg-slate-100 transition-colors shrink-0"

      >

        <Menu className="w-6 h-6 text-slate-600" />

      </button>



      <div className="min-w-0 flex-1">

        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 font-sans tracking-tight truncate">

          {getPageTitle()}

        </h1>

      </div>



      <div className="flex items-center shrink-0">

        <div className="h-10 border-l-[1.5px] border-slate-300 mr-3 sm:mr-4 self-center hidden sm:block"></div>



        <div className="relative" ref={dropdownRef}>

          <div

            className="flex items-center group cursor-pointer"

            onClick={() => setIsDropdownOpen(!isDropdownOpen)}

          >

            <div className="text-right mr-2 sm:mr-3.5 hidden md:block">

              <p className="text-[15px] font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors truncate max-w-[140px] lg:max-w-none">

                {user.name}

              </p>

              <span className="text-[11px] font-bold text-slate-400 tracking-wide leading-none mt-0.5 block hidden sm:block">

                {user.roleLabel}

              </span>

            </div>



            <div className="relative">

              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[3px] ${user.avatarColor} overflow-hidden flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105 bg-slate-100`}>

                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-slate-500 mt-1" fill="currentColor" viewBox="0 0 24 24">

                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />

                </svg>

              </div>

              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>

            </div>



            <svg

              className={`w-4 h-4 text-slate-400 ml-1.5 sm:ml-2 transition-transform duration-200 hidden sm:block ${isDropdownOpen ? "rotate-180" : ""}`}

              fill="none"

              stroke="currentColor"

              viewBox="0 0 24 24"

            >

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />

            </svg>

          </div>



          {isDropdownOpen && (

            <div className="absolute top-full right-0 mt-3 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-2 z-50 transform opacity-100 scale-100 transition-all origin-top-right">

              <button

                onClick={handleLogout}

                className="w-full flex items-center px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"

              >

                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />

                </svg>

                ออกจากระบบ

              </button>

            </div>

          )}

        </div>

      </div>

    </header>

  );

}

