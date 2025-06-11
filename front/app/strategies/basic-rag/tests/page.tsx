export default function BasicRAGTests() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Basic RAG Test Cases</h2>
      <div className="space-y-2">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium">Test Case #1: Chunk Size Validation</h3>
          <p className="text-sm text-muted-foreground">Verify chunks don't exceed maximum token limit</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium">Test Case #2: Retrieval Accuracy</h3>
          <p className="text-sm text-muted-foreground">Measure precision@k for simple queries</p>
        </div>
      </div>
    </div>
  )
}
