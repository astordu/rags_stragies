'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

// API调用函数
const API_BASE_URL = 'http://localhost:8000/api'

async function splitDocument(file: File, chunkSize: number, overlap: number, separator: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('chunk_size', chunkSize.toString())
  formData.append('overlap', overlap.toString())
  formData.append('separator', separator)

  const response = await fetch(`${API_BASE_URL}/split`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('文档切分失败')
  }

  return response.json()
}

async function uploadToKnowledgeBase(chunks: string[], knowledgeBaseName: string) {
  const response = await fetch(`${API_BASE_URL}/upload-to-knowledge-base`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chunks,
      knowledge_base_name: knowledgeBaseName,
    }),
  })

  if (!response.ok) {
    throw new Error('上传到知识库失败')
  }

  return response.json()
}

export default function BasicRAGTests() {
  const [file, setFile] = useState<File | null>(null)
  const [chunks, setChunks] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [knowledgeBaseName, setKnowledgeBaseName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  
  // 切分参数配置
  const [chunkSize, setChunkSize] = useState(1000)
  const [overlap, setOverlap] = useState(200)
  const [separator, setSeparator] = useState('\\n\\n,\\n')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)
    setFile(file)
    
    try {
      const result = await splitDocument(file, chunkSize, overlap, separator)
      setChunks(result.chunks)
    } catch (error: any) {
      console.error('文档处理错误:', error)
      setError(error.message || '文档处理失败，请重试')
      setFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadToKnowledgeBase = async () => {
    if (!knowledgeBaseName.trim()) {
      setError('请输入知识库名称')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const result = await uploadToKnowledgeBase(chunks, knowledgeBaseName)
      alert(result.message)
    } catch (error: any) {
      console.error('上传失败:', error)
      setError(error.message || '上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          上传文档、配置参数 &rarr; 自动切分
        </h2>
        <p className="text-gray-600"></p>
      </motion.div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm"
          role="alert"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      {/* 切分参数配置 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">切分参数配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Chunk Size</Label>
              <Input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                min={100}
                max={2000}
                step={100}
                disabled={isLoading}
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Overlap</Label>
              <Input
                type="number"
                value={overlap}
                onChange={(e) => setOverlap(Number(e.target.value))}
                min={0}
                max={500}
                step={50}
                disabled={isLoading}
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">分隔符</Label>
              <Input
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                placeholder="输入分隔符，如: \n\n,\n"
                disabled={isLoading}
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 文档上传区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">文档上传</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">点击上传</span> 或拖拽文件</p>
                  <p className="text-xs text-gray-500">支持 PDF, TXT, DOC, DOCX</p>
                </div>
                <Input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            </div>
            {isLoading && (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-sm text-gray-600">正在处理文档...</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* 切分结果展示 */}
      {chunks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                切分结果 <span className="text-blue-600">({chunks.length} 个片段)</span>
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-64">
                  <Input
                    type="text"
                    value={knowledgeBaseName}
                    onChange={(e) => setKnowledgeBaseName(e.target.value)}
                    placeholder="输入知识库名称"
                    disabled={isUploading}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button
                  onClick={handleUploadToKnowledgeBase}
                  disabled={isUploading || !knowledgeBaseName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>上传中...</span>
                    </div>
                  ) : (
                    '上传到知识库'
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto p-2 custom-scrollbar">
              {chunks.map((chunk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">片段 #{index + 1}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {chunk.length} 字符
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{chunk}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  )
}
