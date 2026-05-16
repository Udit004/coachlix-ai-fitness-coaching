// api/exercises/suggest/route.js
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function mapEquipment(eq) {
  const m = {
    "barbell": "Barbell",
    "dumbbell": "Dumbbell",
    "cable": "Cable",
    "leverage machine": "Machine",
    "smith machine": "Machine",
    "sled machine": "Machine",
    "assisted": "Machine",
    "machine": "Machine",
    "body weight": "Bodyweight",
    "bodyweight": "Bodyweight",
    "kettlebell": "Kettlebell",
    "medicine ball": "Medicine Ball",
    "resistance band": "Resistance Band",
    "trx": "TRX",
    "ez barbell": "Barbell",
    "bench": "Bench"
  };
  const key = (eq || "").toLowerCase();
  return m[key] || "Bodyweight";
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    if (!q || q.trim().length < 2) {
      return NextResponse.json({ success: true, exercises: [] });
    }

    // Support common var names and ensure Node runtime reads it
    const apiKey = process.env.RAPIDAPI_KEY || process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "RAPIDAPI_KEY is not configured" },
        { status: 500 }
      );
    }

    const host = "exercisedb.p.rapidapi.com";
    async function fetchList(path) {
      const resp = await fetch(`https://${host}${path}`, {
        headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": host },
        cache: "no-store",
      });
      if (!resp.ok) {
        return [];
      }
      const data = await resp.json();
      return Array.isArray(data) ? data : [];
    }

    // Try multiple strategies: name, bodyPart, target (muscle), equipment
    let list = await fetchList(`/exercises/name/${encodeURIComponent(q)}`);

    // Heuristic mappings
    const bodyPartMap = {
      chest: "chest",
      back: "back",
      shoulders: "shoulders",
      shoulder: "shoulders",
      legs: "upper legs",
      quads: "upper legs",
      hamstrings: "upper legs",
      arms: "upper arms",
      biceps: "upper arms",
      triceps: "upper arms",
      forearms: "lower arms",
      calves: "lower legs",
      abs: "waist",
      core: "waist",
    };
    const equipmentMap = {
      barbell: "barbell",
      dumbbell: "dumbbell",
      cable: "cable",
      machine: "leverage machine",
      bodyweight: "body weight",
      kettlebell: "kettlebell",
      "resistance band": "resistance band",
      trx: "trx",
      bench: "bench",
    };

    const lower = q.toLowerCase();
    if (list.length === 0 && bodyPartMap[lower]) {
      list = await fetchList(`/exercises/bodyPart/${encodeURIComponent(bodyPartMap[lower])}`);
    }
    if (list.length === 0 && equipmentMap[lower]) {
      list = await fetchList(`/exercises/equipment/${encodeURIComponent(equipmentMap[lower])}`);
    }
    // Some targets common names -> ExerciseDB targets (approx)
    const targetMap = {
      delts: "delts",
      shoulders: "delts",
      lats: "lats",
      back: "lats",
      chest: "pectorals",
      abs: "abs",
      core: "abs",
      biceps: "biceps",
      triceps: "triceps",
      quads: "quads",
      hamstrings: "hamstrings",
      calves: "calves",
      glutes: "glutes",
      forearms: "forearms",
      traps: "traps",
    };
    if (list.length === 0 && targetMap[lower]) {
      list = await fetchList(`/exercises/target/${encodeURIComponent(targetMap[lower])}`);
    }

    // As a final fallback, use official lists to resolve unknown terms
    if (list.length === 0) {
      try {
        const [targets, bodyParts, equipmentList] = await Promise.all([
          fetchList(`/exercises/targetList`),
          fetchList(`/exercises/bodyPartList`),
          fetchList(`/exercises/equipmentList`),
        ]);

        const findMatch = (arr) => (arr || []).find((v) => String(v).toLowerCase() === lower);

        const matchedTarget = findMatch(targets);
        if (matchedTarget) {
          list = await fetchList(`/exercises/target/${encodeURIComponent(matchedTarget)}`);
        }

        if (list.length === 0) {
          const matchedBodyPart = findMatch(bodyParts);
          if (matchedBodyPart) {
            list = await fetchList(`/exercises/bodyPart/${encodeURIComponent(matchedBodyPart)}`);
          }
        }

        if (list.length === 0) {
          const matchedEq = findMatch(equipmentList);
          if (matchedEq) {
            list = await fetchList(`/exercises/equipment/${encodeURIComponent(matchedEq)}`);
          }
        }
      } catch (_) {
        // ignore list errors, return empty gracefully
      }
    }

    const normalized = list.slice(0, 20).map((e) => ({
      name: capitalize(e.name || "Exercise"),
      category: "Strength",
      difficulty: "Beginner",
      primaryMuscleGroups: [capitalize(e.target || "Full Body")],
      secondaryMuscleGroups: (e.secondaryMuscles || []).map(capitalize),
      equipment: [mapEquipment(e.equipment)],
      instructions: (e.instructions || []).map((d, i) => ({ step: i + 1, description: d })),
      description: `${capitalize(e.bodyPart || "Body")} • ${capitalize(e.target || "")}`.trim(),
      metrics: { isWeighted: true, hasReps: true, defaultSets: 3, defaultReps: "8-12", defaultRestTime: 60 },
      videoUrl: e.videoURL || "",
      isActive: true,
    }));

    return NextResponse.json({ success: true, exercises: normalized });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "External suggest failed", error: err.message },
      { status: 500 }
    );
  }
}


