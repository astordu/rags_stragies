export default function MultiHopTests() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Multi-hop Test Cases</h2>
      <div className="space-y-2">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium">Test Case #1: Iteration Limit</h3>
          <p className="text-sm text-muted-foreground">Verify system stops after maximum hops</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium">Test Case #2: Context Preservation</h3>
          <p className="text-sm text-muted-foreground">Check if context carries between hops</p>
        </div>
      </div>
    </div>
  )
}
