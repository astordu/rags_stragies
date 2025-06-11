import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 记录请求开始
    console.log('收到问答请求')

    // 解析请求体
    const body = await request.json()
    console.log('请求体:', body)

    const { message, chunks } = body

    // 验证必要参数
    if (!message) {
      console.error('缺少message参数')
      return NextResponse.json(
        { success: false, error: '缺少message参数' },
        { status: 400 }
      )
    }

    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 根据用户问题生成模拟回答
    let response = ""
    if (message.includes("总结") || message.includes("概述")) {
      response = "根据文档内容，这是一个关于RAG（检索增强生成）系统的实现。该系统主要包含文档处理、文本切分和智能问答三个主要功能模块。文档处理支持多种格式，文本切分提供了灵活的配置选项，智能问答则基于切分后的文本片段进行回答。"
    } else if (message.includes("如何") || message.includes("怎么")) {
      response = "要使用这个系统，首先需要上传文档，然后配置切分参数（包括chunk大小、重叠度等），系统会自动处理文档并显示切分结果。之后，您就可以在问答界面输入问题，系统会基于文档内容给出回答。"
    } else if (message.includes("优点") || message.includes("优势")) {
      response = "这个系统的主要优势在于：1. 支持多种文档格式；2. 提供灵活的文本切分参数配置；3. 实时显示处理结果；4. 智能问答功能；5. 用户友好的界面设计。"
    } else {
      response = "我理解您的问题，但需要更多具体信息才能给出准确的回答。您可以尝试询问关于系统功能、使用方法或具体实现细节的问题。"
    }

    // 记录响应
    console.log('生成回答:', response)

    return NextResponse.json({
      success: true,
      response,
      metadata: {
        question: message,
        chunksUsed: chunks?.length || 0,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    // 详细记录错误
    console.error('问答处理错误:', error)
    console.error('错误详情:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    })

    return NextResponse.json(
      { 
        success: false, 
        error: '问答处理失败',
        details: error?.message || '未知错误'
      },
      { status: 500 }
    )
  }
} 