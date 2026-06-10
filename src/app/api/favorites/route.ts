import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getFavoriteIds, setFavoriteIds } from "@/lib/favorites-db";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ favoriteIds: getFavoriteIds(user.id) });
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const favoriteIds = Array.isArray(body.favoriteIds)
    ? body.favoriteIds.filter((id: unknown) => typeof id === "string")
    : null;

  if (!favoriteIds) {
    return NextResponse.json({ error: "Invalid favoriteIds" }, { status: 400 });
  }

  setFavoriteIds(user.id, favoriteIds);
  return NextResponse.json({ favoriteIds });
}
