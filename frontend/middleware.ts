import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const middleware = (request: NextRequest) => {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;
  const { pathname } = request.nextUrl;

  // 1. Cek apakah token ada
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // 2. Decode JWT Payload menggunakan Buffer (Aman untuk Edge Runtime)
    const payLoadBase64 = token.split(".")[1];
    const decodedString = Buffer.from(payLoadBase64, "base64").toString(
      "utf-8",
    );
    const decodedPayload = JSON.parse(decodedString);

    // 3. Pengecekan Expired Token
    const expTime = decodedPayload.exp * 1000;
    const currentTime = Date.now();

    if (currentTime > expTime) {
      // Jika token kedaluwarsa, arahkan ke login
      const response = NextResponse.redirect(new URL("/login", request.url));
      // Opsional: Hapus cookie token yang sudah expired agar tidak menumpuk
      response.cookies.delete("token");
      response.cookies.delete("role");
      return response;
    }
  } catch (error) {
    // Jika format token rusak / gagal di-parse, anggap tidak valid dan redirect
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Proteksi Hak Akses (Role Siswa)
  if (
    (pathname.startsWith("/createsessions") ||
      pathname.startsWith("/createpolls")) &&
    role?.toLowerCase() === "siswa"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/createsessions/:path*",
    "/createpolls/:path*",
  ],
};
