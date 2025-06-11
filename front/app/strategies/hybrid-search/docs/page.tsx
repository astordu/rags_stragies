import { marked } from 'marked'

async function getMarkdownContent() {
  const response = await fetch('./content.md')
  return await response.text()
}

export default async function HybridSearchDocs() {
  const fileContents = await getMarkdownContent()
  const htmlContent = marked(fileContents)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Hybrid Search Documentation</h2>
      <div 
        className="prose prose-sm dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}
