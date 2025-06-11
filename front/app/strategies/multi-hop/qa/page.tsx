export default function MultiHopCode() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Multi-hop Implementation</h2>
      <pre className="p-4 bg-muted rounded-md text-sm">
        {`// Multi-hop retrieval function
async function multiHopRetrieve(query, maxHops = 3) {
  let context = [];
  for (let i = 0; i < maxHops; i++) {
    const results = await retrieve(query, context);
    context.push(...results);
    query = refineQuery(query, results);
  }
  return context;
}`}
      </pre>
    </div>
  )
}
