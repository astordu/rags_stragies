export default function BasicRAGCode() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Basic RAG Implementation</h2>
      <pre className="p-4 bg-muted rounded-md text-sm">
        {`// Basic chunking function
function chunkText(text, chunkSize = 512) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}`}
      </pre>
    </div>
  )
}
