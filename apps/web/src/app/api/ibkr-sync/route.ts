import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('IBKR API同步功能已被取消');
    
    // 返回成功响应，但不执行任何实际的同步操作
    return NextResponse.json({
      message: 'IBKR API同步功能已被取消',
      testMode: false,
      processedAssets: 0,
      abnormalAssets: 0,
      accountId: ''
    }, { status: 200 });
    
  } catch (error) {
    console.error('处理请求时发生错误:', error);
    return NextResponse.json({ 
      error: '处理请求时发生错误', 
      details: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
