import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as jose from "jose";

const JWT_COOKIE = "admin_token";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const secretEnv = process.env.JWT_SECRET;
    if (!secretEnv) {
      console.error("JWT_SECRET is not set");
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }
    const secret = new TextEncoder().encode(secretEnv);

    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await new jose.SignJWT({
      sub: String(admin.id),
      role: "ADMIN",
      email: admin.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(secret);

    const res = NextResponse.json({ id: admin.id, email: admin.email });
    res.cookies.set(JWT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, 
    });

    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
