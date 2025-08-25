import { NextResponse } from 'next/server';
import { GetWorkoutPlanTool } from '@/lib/tools';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log('🧪 Testing GetWorkoutPlanTool with userId:', userId);
    
    const tool = new GetWorkoutPlanTool();
    const result = await tool._call(JSON.stringify({ userId }));
    
    console.log('✅ Tool test result:', result);
    
    return NextResponse.json({ 
      success: true, 
      result,
      message: 'Tool test completed successfully'
    });
    
  } catch (error) {
    console.error('❌ Tool test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
