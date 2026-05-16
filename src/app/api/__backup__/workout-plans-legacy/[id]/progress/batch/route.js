// api/workout-plans/[id]/progress/batch/route.js - Batch update progress entries
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../lib/db";
import WorkoutPlan from "@/models/WorkoutPlan";
import { verifyUserToken } from "@/lib/verifyUser";

// PUT /api/workout-plans/[id]/progress/batch - Batch update multiple progress entries
export async function PUT(request, { params }) {
  try {
    const { id: planId } = params;
    
    // Verify authentication
    const authHeader =
      request.headers.get("Authorization") ||
      request.headers.get("authorization");
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

    const body = await request.json();
    const { entries } = body;
    
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { message: "entries array is required and must not be empty" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the workout plan
    const plan = await WorkoutPlan.findOne({
      _id: planId,
      userId: user.uid
    });

    if (!plan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    const results = {
      success: [],
      errors: [],
      totalProcessed: entries.length
    };

    // Process each entry
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        // Validate entry structure
        if (!entry.date) {
          results.errors.push({
            index: i,
            error: "Date is required for each entry"
          });
          continue;
        }

        // Create progress entry with validation
        const progressEntry = {
          date: new Date(entry.date),
          weight: entry.weight && entry.weight > 0 ? Number(entry.weight) : undefined,
          bodyFat: entry.bodyFat && entry.bodyFat >= 0 && entry.bodyFat <= 100 ? Number(entry.bodyFat) : undefined,
          measurements: {},
          photos: entry.photos || [],
          notes: entry.notes ? String(entry.notes).trim() : undefined
        };

        // Process measurements
        if (entry.measurements) {
          const validMeasurements = ['chest', 'waist', 'hips', 'arms', 'thighs'];
          validMeasurements.forEach(measurement => {
            if (entry.measurements[measurement] && entry.measurements[measurement] > 0) {
              progressEntry.measurements[measurement] = Number(entry.measurements[measurement]);
            }
          });
        }

        // Validate and filter photos
        if (entry.photos && Array.isArray(entry.photos)) {
          progressEntry.photos = entry.photos.filter(photo => {
            return photo.url && 
                   ['front', 'side', 'back'].includes(photo.type) &&
                   typeof photo.url === 'string';
          });
        }

        // Check if entry with same date already exists
        const existingEntryIndex = plan.progress.findIndex(
          existing => existing.date.toDateString() === progressEntry.date.toDateString()
        );

        if (existingEntryIndex !== -1) {
          // Update existing entry
          plan.progress[existingEntryIndex] = progressEntry;
          results.success.push({
            index: i,
            action: 'updated',
            date: progressEntry.date
          });
        } else {
          // Add new entry
          plan.progress.push(progressEntry);
          results.success.push({
            index: i,
            action: 'added',
            date: progressEntry.date
          });
        }

      } catch (entryError) {
        results.errors.push({
          index: i,
          error: entryError.message
        });
      }
    }

    // Sort progress entries by date (newest first)
    plan.progress.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Save the updated plan
    await plan.save();

    return NextResponse.json({
      success: true,
      message: `Batch update completed. ${results.success.length} entries processed successfully, ${results.errors.length} errors.`,
      results,
      totalEntries: plan.progress.length
    });
    
  } catch (error) {
    console.error("Error in batch progress update:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// =================== EXPORT ROUTE ===================

// api/workout-plans/[id]/export/route.js - Export workout plan data
export async function GET(request, { params }) {
  try {
    const { id: planId } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    
    // Verify authentication
    const authHeader =
      request.headers.get("Authorization") ||
      request.headers.get("authorization");
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

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { message: "Invalid format. Supported formats: json, csv" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the workout plan with all data
    const plan = await WorkoutPlan.findOne({
      _id: planId,
      userId: user.uid
    });

    if (!plan) {
      return NextResponse.json(
        { message: "Workout plan not found or unauthorized" },
        { status: 404 }
      );
    }

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        exportedAt: new Date().toISOString(),
        plan: {
          id: plan._id,
          name: plan.name,
          description: plan.description,
          goal: plan.goal,
          difficulty: plan.difficulty,
          duration: plan.duration,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
          progress: plan.progress,
          stats: plan.stats,
          weeks: plan.weeks
        }
      });
    }

    if (format === 'csv') {
      const csvData = generateCSV(plan);
      
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${plan.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.csv"`
        }
      });
    }
    
  } catch (error) {
    console.error("Error exporting workout plan data:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate CSV data
function generateCSV(plan) {
  const headers = [
    'Date',
    'Type',
    'Week',
    'Day',
    'Workout Name',
    'Exercise Name',
    'Sets',
    'Reps',
    'Weight',
    'Duration',
    'Completed',
    'Notes',
    'Body Weight',
    'Body Fat %',
    'Chest',
    'Waist',
    'Hips',
    'Arms',
    'Thighs'
  ];

  const rows = [headers.join(',')];

  // Export progress entries
  if (plan.progress && plan.progress.length > 0) {
    plan.progress.forEach(entry => {
      const row = [
        entry.date ? entry.date.toISOString().split('T')[0] : '',
        'Progress Entry',
        '', '', '', '', '', '', '', '', '', 
        entry.notes || '',
        entry.weight || '',
        entry.bodyFat || '',
        entry.measurements?.chest || '',
        entry.measurements?.waist || '',
        entry.measurements?.hips || '',
        entry.measurements?.arms || '',
        entry.measurements?.thighs || ''
      ];
      rows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
    });
  }

  // Export workout data
  if (plan.weeks && plan.weeks.length > 0) {
    plan.weeks.forEach(week => {
      week.days?.forEach(day => {
        if (!day.isRestDay && day.workouts) {
          day.workouts.forEach(workout => {
            workout.exercises?.forEach(exercise => {
              if (exercise.sets && exercise.sets.length > 0) {
                exercise.sets.forEach((set, setIndex) => {
                  const row = [
                    workout.completedAt ? workout.completedAt.toISOString().split('T')[0] : '',
                    'Workout',
                    week.weekNumber,
                    day.dayNumber,
                    workout.name || '',
                    exercise.name || '',
                    setIndex + 1,
                    set.reps || '',
                    set.weight || '',
                    set.duration || '',
                    set.completed ? 'Yes' : 'No',
                    set.notes || '',
                    '', '', '', '', '', '', ''
                  ];
                  rows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
                });
              } else {
                const row = [
                  workout.completedAt ? workout.completedAt.toISOString().split('T')[0] : '',
                  'Workout',
                  week.weekNumber,
                  day.dayNumber,
                  workout.name || '',
                  exercise.name || '',
                  '', '', '', '',
                  exercise.isCompleted ? 'Yes' : 'No',
                  exercise.notes || '',
                  '', '', '', '', '', '', ''
                ];
                rows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
              }
            });
          });
        }
      });
    });
  }

  return rows.join('\n');
}