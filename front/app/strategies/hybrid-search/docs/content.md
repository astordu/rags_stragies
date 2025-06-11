# Hybrid Search Strategy

## Introduction
Hybrid search combines multiple search techniques for better results.

### Components
- **Keyword Search**: Traditional term-based search
- **Vector Search**: Semantic search using embeddings
- **Ranking**: Combines both approaches

## Benefits
- Improved recall
- Better precision
- More relevant results

## Usage
```python
from search import HybridSearch

searcher = HybridSearch()
results = searcher.query("AI techniques")
```
