'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Code, FileText, TestTube2, MessageCircle, Split } from 'lucide-react'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function Home() {
  const [activeStrategy, setActiveStrategy] = useState('basic-rag')
  const [activeTab, setActiveTab] = useState('docs')

  const strategies = [
    {
      id: 'basic-rag',
      title: '简单切分'
    },
    {
      id: 'semantic-similarity',
      title: '语义切分'
    },
    {
      id: 'multi-hop',
      title: '知识图谱'
    }
  ]

  const ContentComponent = dynamic(
    () => import(`@/app/strategies/${activeStrategy}/${activeTab}/page`),
    { loading: () => <p>Loading...</p> }
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">RAG Strategies</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* 在移动端显示下拉选择框 */}
        <div className="lg:hidden">
          <Select value={activeStrategy} onValueChange={setActiveStrategy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择策略" />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 在桌面端显示卡片列表 */}
        <div className="hidden lg:block space-y-2">
          {strategies.map((strategy) => (
            <Card 
              key={strategy.id}
              className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                activeStrategy === strategy.id ? 'border-primary' : ''
              }`}
              onClick={() => setActiveStrategy(strategy.id)}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-base">{strategy.title}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="bg-background rounded-lg border p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="docs">
                <FileText className="mr-2 h-4 w-4" />
                说明
              </TabsTrigger>
              <TabsTrigger value="split">
                <Split className="mr-2 h-4 w-4" />
                切分
              </TabsTrigger>
              <TabsTrigger value="qa">
                <MessageCircle className="mr-2 h-4 w-4" />
                问答
              </TabsTrigger>
            </TabsList>

            <TabsContent value="docs">
              <ContentComponent />
            </TabsContent>

            <TabsContent value="split">
              <ContentComponent />
            </TabsContent>

            <TabsContent value="qa">
              <ContentComponent />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
