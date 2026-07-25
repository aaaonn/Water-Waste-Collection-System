"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BarChart3,
    Home,
    CreditCard,
    Users,
    ChevronDown,
    ChevronUp,
    Settings,
    Building,
    History,
    X,
} from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [isManagementOpen, setIsManagementOpen] = useState(true);

    const isActive = (path: string) => pathname === path;

    const getRole = () => {
        if (pathname.includes("/page/household")) return "household";
        if (pathname.includes("/page/super_admin")) return "super_admin";
        if (pathname.includes("/page/admin")) return "admin";
        return "staffsubdistrict";
    };

    const role = getRole();
    const SrcLogo = ""; // เปลี่ยนเป็น path รูปจริง เช่น "/tunglaung_logo.jpg"

    const handleNavClick = () => {
        if (window.matchMedia("(max-width: 1023px)").matches) {
            onClose();
        }
    };

    return (
        <aside
            className={`fixed lg:static inset-y-0 left-0 z-30 w-68 max-w-[85vw] bg-[#0B132B] text-white flex flex-col h-screen border-r border-slate-800 shadow-xl select-none font-sans transition-transform duration-300 ease-in-out lg:shrink-0 ${isOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
                }`}
        >
            <div className="p-4 lg:p-6 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white overflow-hidden shadow-md">
                        {SrcLogo ? (
                            <img
                                src={SrcLogo}
                                alt="โลโก้"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-gray-500 font-bold text-xs select-none">โลโก้</span>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[15px] lg:text-[16px] font-bold text-white tracking-wide leading-tight">ระบบจัดการ อบต.</span>
                        <span className="text-[15px] lg:text-[16px] font-bold text-white tracking-wide leading-tight">ค่าน้ำ & ค่าขยะ</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="ปิดเมนู"
                    className="lg:hidden p-2 rounded-xl hover:bg-[#1C2541]/50 transition-colors shrink-0"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">

                {(role === "staffsubdistrict" || role === "admin") && (
                    <>
                        <Link
                            href={`/page/${role}/dashboard`}
                            onClick={handleNavClick}
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive(`/page/${role}/dashboard`)
                                ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"
                                }`}
                        >
                            <LayoutDashboard className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive(`/page/${role}/dashboard`) ? "text-[#0B132B]" : "text-slate-400 group-hover:text-slate-200"
                                }`} />
                            <span className="text-[14px]">หน้าหลัก</span>
                        </Link>

                        <Link
                            href={`/page/${role}/base_settings`}
                            onClick={handleNavClick}
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive(`/page/${role}/base_settings`)
                                ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"
                                }`}
                        >
                            <Settings className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive(`/page/${role}/base_settings`) ? "text-[#0B132B]" : "text-slate-400 group-hover:text-slate-200"
                                }`} />
                            <span className="text-[14px]">ตั้งค่าข้อมูลพื้นฐานค่าน้ำและค่าขยะ</span>
                        </Link>

                        <div>
                            <button
                                onClick={() => setIsManagementOpen(!isManagementOpen)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group ${pathname.includes("/subdistrict_") || pathname.includes("/household")
                                    ? "bg-[#1C2541]/30 text-white font-medium"
                                    : "text-slate-400 hover:bg-[#1C2541]/30 hover:text-slate-200"
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Home className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${pathname.includes("/subdistrict_") || pathname.includes("/household") ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                                        }`} />
                                    <span className="text-[14px] text-left">จัดการหมู่บ้านและครัวเรือน</span>
                                </div>
                                {isManagementOpen ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                            </button>

                            {isManagementOpen && (
                                <div className="mt-1 ml-4 pl-4 border-l border-slate-800 space-y-1 transition-all duration-300">
                                    <Link
                                        href={`/page/${role}/subdistrict_management/villages`}
                                        onClick={handleNavClick}
                                        className={`flex items-center px-4 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ${isActive(`/page/${role}/subdistrict_management`) || pathname.includes("/subdistrict_management/villages")
                                            ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                            : "text-slate-400 hover:text-white"
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${isActive(`/page/${role}/subdistrict_management`) || pathname.includes("/subdistrict_management/villages") ? "bg-[#0B132B]" : "bg-transparent"
                                            }`} />
                                        จัดการหมู่บ้าน
                                    </Link>

                                    <Link
                                        href={`/page/${role}/subdistrict_management/household`}
                                        onClick={handleNavClick}
                                        className={`flex items-center px-4 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ${isActive(`/page/${role}/subdistrict_management/household`)
                                            ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                            : "text-slate-400 hover:text-white"
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${isActive(`/page/${role}/subdistrict_management/household`) ? "bg-[#0B132B]" : "bg-transparent"
                                            }`} />
                                        จัดการครัวเรือน
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Link
                            href={`/page/${role}/payments`}
                            onClick={handleNavClick}
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive(`/page/${role}/payments`)
                                ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"
                                }`}
                        >
                            <CreditCard className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive(`/page/${role}/payments`) ? "text-[#0B132B]" : "text-slate-400 group-hover:text-slate-200"
                                }`} />
                            <span className="text-[14px]">ชำระเงิน</span>
                        </Link>

                        <Link
                            href={`/page/${role}/reports`}
                            onClick={handleNavClick}
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive(`/page/${role}/reports`)
                                ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"
                                }`}
                        >
                            <BarChart3 className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive(`/page/${role}/reports`) ? "text-[#0B132B]" : "text-slate-400 group-hover:text-slate-200"
                                }`} />
                            <span className="text-[14px]">รายงาน</span>
                        </Link>

                        {role === "admin" && (
                            <Link
                                href={`/page/${role}/users`}
                                onClick={handleNavClick}
                                className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive(`/page/${role}/users`)
                                    ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                    : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"
                                    }`}
                            >
                                <Users className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive(`/page/${role}/users`) ? "text-[#0B132B]" : "text-slate-400 group-hover:text-slate-200"
                                    }`} />
                                <span className="text-[14px]">จัดการผู้ใช้</span>
                            </Link>
                        )}
                    </>
                )}

                {role === "household" && (
                    <>
                        <Link
                            href="/page/household/dashboard"
                            onClick={handleNavClick}
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive("/page/household/dashboard")
                                ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"
                                }`}
                        >
                            <LayoutDashboard className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive("/page/household/dashboard") ? "text-[#0B132B]" : "text-slate-400 group-hover:text-slate-200"
                                }`} />
                            <span className="text-[14px]">หน้าหลัก</span>
                        </Link>

                        <Link
                            href="/page/household/payment"
                            onClick={handleNavClick}
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive("/page/household/payment")
                                ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"
                                }`}
                        >
                            <CreditCard className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive("/page/household/payment") ? "text-[#0B132B]" : "text-slate-400 group-hover:text-slate-200"
                                }`} />
                            <span className="text-[14px]">ชำระค่าบริการ</span>
                        </Link>

                        <Link
                            href="/page/household/history"
                            onClick={handleNavClick}
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive("/page/household/history")
                                ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"
                                }`}
                        >
                            <History className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive("/page/household/history") ? "text-[#0B132B]" : "text-slate-400 group-hover:text-slate-200"
                                }`} />
                            <span className="text-[14px]">ประวัติการชำระเงิน</span>
                        </Link>

                        <Link
                            href="/page/household/settings"
                            onClick={handleNavClick}
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive("/page/household/settings")
                                ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"
                                }`}
                        >
                            <Settings className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive("/page/household/settings") ? "text-[#0B132B]" : "text-slate-400 group-hover:text-slate-200"
                                }`} />
                            <span className="text-[14px]">ตั้งค่าบัญชี</span>
                        </Link>
                    </>
                )}

                {role === "super_admin" && (
                    <>
                        <Link
                            href="/page/super_admin/organization_management"
                            onClick={handleNavClick}
                            className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive("/page/super_admin/organization_management")
                                ? "bg-[#38BDF8] text-[#0B132B] font-bold"
                                : "text-slate-400 hover:bg-[#1C2541]/50 hover:text-white"
                                }`}
                        >
                            <Building className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive("/page/super_admin/organization_management") ? "text-[#0B132B]" : "text-slate-400 group-hover:text-slate-200"
                                }`} />
                            <span className="text-[14px]">จัดการองค์กร</span>
                        </Link>
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-500">© 2026 ระบบจัดการ อบต.</p>
            </div>
        </aside>
    );
}
