import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Yahoo Finance指数数据同步功能已被取消');
    
    // 返回成功响应，但不执行任何实际的同步操作
    return NextResponse.json({
      message: 'Yahoo Finance指数数据同步功能已被取消',
      processedIndices: 0,
      indices: [],
      dataSource: 'manual'
    }, { status: 200 });
    
  } catch (error) {
    console.error('处理请求时发生错误:', error);
    return NextResponse.json({ 
      error: '处理请求时发生错误', 
      details: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}