import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  createUser,
  getUserByEmail,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { mergeFavoriteIds } from "@/lib/favorites-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const localFavoriteIds = Array.isArray(body.localFavoriteIds)
      ? body.localFavoriteIds.filter((id: unknown) => typeof id === "string")
      : [];

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (getUserByEmail(email)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = createUser(email, passwordHash, name);
    const mergedFavorites = mergeFavoriteIds(user.id, localFavoriteIds);
    const token = await createSessionToken(user.id);

    const response = NextResponse.json({ user, favoriteIds: mergedFavorites });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
