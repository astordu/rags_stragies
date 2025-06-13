from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import os
import asyncio
import json
import asyncpg
from utils import get_embedding

router = APIRouter()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:8b")

@router.get("/strategies/basic-rag/knowledge-bases")
async def list_knowledge_bases():
    """
    查询所有已存在的知识库名称
    """
    try:
        PG_CONN_STR = os.getenv("PG_CONN_STR", "postgresql://postgres:postgres@localhost:5432/postgres")
        conn = await asyncpg.connect(PG_CONN_STR)
        try:
            rows = await conn.fetch("SELECT DISTINCT knowledge_base_name FROM knowledge_chunks")
            kb_names = [row["knowledge_base_name"] for row in rows]
        finally:
            await conn.close()
        return JSONResponse(content={"knowledge_bases": kb_names})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/strategies/basic-rag/qa/api")
async def rag_qa_api(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    knowledge_base_name = data.get("knowledge_base_name")
    if not knowledge_base_name:
        raise HTTPException(status_code=400, detail="knowledge_base_name is required")
    if not messages or not messages[-1].get("content"):
        raise HTTPException(status_code=400, detail="No user query found")
    user_query = messages[-1]["content"]

    # 1. 获取query embedding
    query_embedding = get_embedding(user_query)
    # 转为 pgvector 兼容字符串
    query_embedding_str = '[' + ','.join(str(x) for x in query_embedding) + ']'

    # 2. 检索最相似的7条
    PG_CONN_STR = os.getenv("PG_CONN_STR", "postgresql://postgres:postgres@localhost:5432/postgres")
    conn = await asyncpg.connect(PG_CONN_STR)
    try:
        # 假设embedding字段为pgvector类型，使用欧氏距离/余弦相似度
        rows = await conn.fetch(
            """
            SELECT chunk_text
            FROM knowledge_chunks
            WHERE knowledge_base_name = $1
            ORDER BY (embedding <#> $2::vector) ASC
            LIMIT 7
            """,
            knowledge_base_name,
            query_embedding_str
        )
        context_chunks = [row["chunk_text"] for row in rows]
    finally:
        await conn.close()

    # 3. 拼接context，插入到messages最前面
    context_text = "\n".join(context_chunks)
    context_message = {"role": "system", "content": f"参考资料：\n{context_text}"}
    new_messages = [context_message] + messages

    url = f"{OLLAMA_BASE_URL}/api/chat"
    headers = {"Content-Type": "application/json"}
    payload = {
        "model": OLLAMA_MODEL,
        "messages": new_messages,
        "stream": True
    }
    async def stream_response():
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                async for chunk in resp.aiter_text():
                    try:
                        data = json.loads(chunk)
                        content = data.get("message", {}).get("content", "")
                        for char in content:
                            yield char
                            await asyncio.sleep(0)
                    except Exception:
                        continue
    return StreamingResponse(stream_response(), media_type="text/plain")
