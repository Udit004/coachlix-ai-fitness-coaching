// api/exercises/route.js
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Exercise from "@/models/Exercise";
import { verifyUserToken } from "@/lib/verifyUser";

// GET /api/exercises - Get exercises with filtering and search
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const equipment = searchParams.get("equipment");
    const muscleGroups = searchParams.get("muscleGroups");
    const popular = searchParams.get("popular");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    let query = { isActive: true };
    let sort = { popularity: -1, averageRating: -1 };

    // Build query based on filters
    if (search) {
      // Prefer text index if present, otherwise regex fallback across common fields
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { primaryMuscleGroups: { $in: [new RegExp(search, 'i')] } },
        { secondaryMuscleGroups: { $in: [new RegExp(search, 'i')] } },
        { equipment: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (equipment) {
      const eqList = equipment.split(',').filter(Boolean);
      if (eqList.length > 0) {
        query.equipment = { $in: eqList.map((e) => new RegExp(`^${e}$`, 'i')) };
      }
    }
    
    if (muscleGroups) {
      const groups = muscleGroups.split(',').filter(Boolean).map((g) => new RegExp(`^${g}$`, 'i'));
      if (groups.length > 0) {
        // Merge with existing $or from search if present
        const muscleClause = [
          { primaryMuscleGroups: { $in: groups } },
          { secondaryMuscleGroups: { $in: groups } }
        ];
        if (query.$or) {
          query.$or = [...query.$or, ...muscleClause];
        } else {
          query.$or = muscleClause;
        }
      }
    }

    if (popular === 'true') {
      sort = { popularity: -1, averageRating: -1 };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    let exercises = await Exercise.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Fallback: if no results, loosen filters to return popular suggestions
    if (exercises.length === 0) {
      const fallbackQuery = { isActive: true };
      if (category) fallbackQuery.category = category;
      if (difficulty) fallbackQuery.difficulty = difficulty;
      exercises = await Exercise.find(fallbackQuery)
        .sort({ popularity: -1, averageRating: -1 })
        .limit(limit)
        .lean();
    }

    const total = await Exercise.countDocuments(query);

    return NextResponse.json({
      success: true,
      exercises,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/exercises - Create new exercise (admin only)
export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
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

    await connectDB();
    const body = await request.json();

    const exercise = new Exercise({
      ...body,
      createdBy: user.role === 'admin' ? 'admin' : 'user'
    });

    const savedExercise = await exercise.save();

    return NextResponse.json({
      success: true,
      exercise: savedExercise,
      message: "Exercise created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating exercise:", error);
    
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}