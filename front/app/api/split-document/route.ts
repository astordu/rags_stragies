import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('收到文档切分请求')

    // 解析表单数据
    const formData = await request.formData()
    const file = formData.get('file') as File
    console.log('表单数据:', {
      fileName: file?.name,
      chunkSize: formData.get('chunkSize'),
      overlap: formData.get('overlap'),
      separator: formData.get('separator')
    })

    if (!file) {
      console.error('未找到文件')
      return NextResponse.json(
        { success: false, error: '未找到文件' },
        { status: 400 }
      )
    }

    const chunkSize = parseInt(formData.get('chunkSize') as string)
    const overlap = parseInt(formData.get('overlap') as string)
    const separator = formData.get('separator') as string

    // 验证参数
    if (isNaN(chunkSize) || chunkSize <= 0) {
      console.error('无效的chunkSize:', chunkSize)
      return NextResponse.json(
        { success: false, error: '无效的chunkSize参数' },
        { status: 400 }
      )
    }

    if (isNaN(overlap) || overlap < 0) {
      console.error('无效的overlap:', overlap)
      return NextResponse.json(
        { success: false, error: '无效的overlap参数' },
        { status: 400 }
      )
    }

    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 生成模拟的文档片段
    const mockChunks = [
      "这是第一个文档片段，包含了重要的信息。这个片段展示了文档的基本结构和内容。",
      "第二个片段继续讨论主题，包含了更多的细节和示例。这些信息对于理解整个文档很重要。",
      "第三个片段深入探讨了具体的技术细节，包括实现方法和注意事项。这部分内容需要仔细阅读。",
      "第四个片段总结了前面的内容，并提供了进一步的建议和指导。这些建议可以帮助读者更好地应用所学知识。",
      "最后一个片段包含了补充信息和参考资料，这些对于深入学习和研究很有帮助。"
    ]

    console.log('生成文档片段:', {
      totalChunks: mockChunks.length,
      fileName: file.name,
      fileSize: file.size
    })

    return NextResponse.json({
      success: true,
      chunks: mockChunks,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        chunkSize,
        overlap,
        separator,
        totalChunks: mockChunks.length
      }
    })
  } catch (error: any) {
    // 详细记录错误
    console.error('文档处理错误:', error)
    console.error('错误详情:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    })

    return NextResponse.json(
      { 
        success: false, 
        error: '文档处理失败',
        details: error?.message || '未知错误'
      },
      { status: 500 }
    )
  }
} 