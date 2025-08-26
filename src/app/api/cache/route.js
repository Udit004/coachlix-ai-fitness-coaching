// api/cache/route.js - Cache management endpoint
import { NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/verifyUser";
import cache from "@/lib/simpleCache";

// GET /api/cache - Get cache statistics
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get cache statistics
    const stats = cache.getStats();
    
    return NextResponse.json({
      success: true,
      cache: {
        size: stats.size,
        keys: stats.keys,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      }
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/cache - Clear all cache
export async function DELETE(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    const user = await verifyUserToken(authHeader);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Clear all cache
    const previousSize = cache.size();
    cache.clear();
    
    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
      cleared: previousSize,
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
