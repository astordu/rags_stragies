'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Code, FileText, TestTube2 } from 'lucide-react'
import { useState } from 'react'
import dynamic from 'next/dynamic'

export default function Home() {
  const [activeStrategy, setActiveStrategy] = useState('basic-rag')
  const [activeTab, setActiveTab] = useState('docs')

  const strategies = [
    {
      id: 'basic-rag',
      title: '简单切分',
      description: 'Standard retrieval-augmented generation approach'
    },
    {
      id: 'hybrid-search',
      title: '上下文切分',
      description: 'Combines vector and keyword search for better results'
    },
    {
      id: 'multi-hop',
      title: '知识图谱',
      description: 'Iterative retrieval for complex queries'
    }
  ]

  const ContentComponent = dynamic(
    () => import(`@/app/strategies/${activeStrategy}/${activeTab}/page`),
    { loading: () => <p>Loading...</p> }
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">RAG Strategies</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
        <div className="space-y-6">
          {strategies.map((strategy) => (
            <Card 
              key={strategy.id}
              className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                activeStrategy === strategy.id ? 'border-primary' : ''
              }`}
              onClick={() => setActiveStrategy(strategy.id)}
            >
              <CardHeader>
                <CardTitle>{strategy.title}</CardTitle>
                <CardDescription>{strategy.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="bg-background rounded-lg border p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="docs">
                <FileText className="mr-2 h-4 w-4" />
                文档
              </TabsTrigger>
              <TabsTrigger value="tests">
                <TestTube2 className="mr-2 h-4 w-4" />
                测试
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code className="mr-2 h-4 w-4" />
                源码
              </TabsTrigger>
            </TabsList>

            <TabsContent value="docs">
              <ContentComponent />
            </TabsContent>

            <TabsContent value="tests">
              <ContentComponent />
            </TabsContent>

            <TabsContent value="code">
              <ContentComponent />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
