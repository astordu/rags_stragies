export default function HybridSearchCode() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Hybrid Search Implementation</h2>
      <pre className="p-4 bg-muted rounded-md text-sm">
        {`// Hybrid scoring function
function hybridScore(vectorScore, keywordScore, alpha = 0.5) {
  return alpha * vectorScore + (1 - alpha) * keywordScore;
}`}
      </pre>
    </div>
  )
}
