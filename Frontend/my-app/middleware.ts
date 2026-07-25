import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const role = request.cookies.get('role')?.value;
  const path = request.nextUrl.pathname;

  // 1. ถ้ายังไม่ได้ล็อกอิน และไม่ใช่หน้าแรก (/)
  if (!token && path !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. ถ้าล็อกอินอยู่แล้ว และกำลังเปิดหน้าแรก (/) -> ส่งตัวไปหน้าแรกของแต่ละสิทธิ์
  if (token && path === '/') {
    if (role === 'super_admin') {
      return NextResponse.redirect(new URL('/page/super_admin/organization_management', request.url));
    } else if (role === 'admin' || role === 'staff') {
      return NextResponse.redirect(new URL(`/page/${role}/dashboard`, request.url));
    } else if (role === 'household') {
      return NextResponse.redirect(new URL('/page/household/dashboard', request.url));
    }
  }

  // 3. กรองสิทธิ์ผู้ใช้งาน (Role Guard) สำหรับหน้าจอจริงภายใต้ /page/*
  if (token) {
    const defaultUrl = role === 'super_admin' 
      ? '/page/super_admin/organization_management' 
      : role === 'household'
      ? '/page/household/dashboard'
      : `/page/${role}/dashboard`;

    if (path.startsWith('/page/super_admin') && role !== 'super_admin') {
      return NextResponse.redirect(new URL(defaultUrl, request.url));
    }
    if (path.startsWith('/page/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(defaultUrl, request.url));
    }
    if (path.startsWith('/page/staff') && role !== 'staff') {
      return NextResponse.redirect(new URL(defaultUrl, request.url));
    }
    if (path.startsWith('/page/household') && role !== 'household') {
      return NextResponse.redirect(new URL(defaultUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/page/super_admin/:path*',
    '/page/admin/:path*',
    '/page/staff/:path*',
    '/page/household/:path*',
    // ยกเว้นไฟล์ static, หน้า api และรูปภาพต่างๆ
    '/((?!api|_next/static|_next/image|favicon.ico|tunglaung_logo.jpg|.*\\.png).*)',
  ],
};
