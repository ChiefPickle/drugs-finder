import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getUserByEmail,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { mergeFavoriteIds } from "@/lib/favorites-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const localFavoriteIds = Array.isArray(body.localFavoriteIds)
      ? body.localFavoriteIds.filter((id: unknown) => typeof id === "string")
      : [];

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const existing = getUserByEmail(email);
    if (!existing) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, existing.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const mergedFavorites = mergeFavoriteIds(existing.id, localFavoriteIds);
    const token = await createSessionToken(existing.id);

    const response = NextResponse.json({
      user: {
        id: existing.id,
        email: existing.email,
        name: existing.name,
        createdAt: existing.createdAt,
      },
      favoriteIds: mergedFavorites,
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
