'use client'
import { useEffect, useState } from 'react'
import { marked } from 'marked'

export default function MultiHopDocs() {
  const [htmlContent, setHtmlContent] = useState('')

  useEffect(() => {
    fetch('./content.md')
      .then(res => res.text())
      .then(text => setHtmlContent(marked(text)))
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Multi-hop Documentation</h2>
      <div
        className="prose prose-sm dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}
