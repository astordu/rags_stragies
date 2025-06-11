import { marked } from 'marked'

async function getMarkdownContent() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  console.log('Current NODE_ENV:', process.env.NODE_ENV)
  console.log('Current API URL:', baseUrl)
  const response = await fetch(`${baseUrl}/docs/basic-rag.md`)
  return await response.text()
}

export default async function BasicRAGDocs() {
  const fileContents = await getMarkdownContent()
  const htmlContent = marked(fileContents)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Basic RAG Documentation</h2>
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <p>Current Environment: {process.env.NODE_ENV}</p>
        <p>API URL: {process.env.NEXT_PUBLIC_BASE_URL}</p>
      </div>
      <div 
        className="prose prose-sm dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}
