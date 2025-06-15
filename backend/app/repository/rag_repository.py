import asyncpg
from app.common.config import Config
from app.common.utils import get_embedding
from app.model.models import KnowledgeBaseRequest



'''
获取所有知识库名称
'''
async def get_knowledge_names():
    conn = await asyncpg.connect(Config.PG_CONN_STR)
    try:
        rows = await conn.fetch("SELECT DISTINCT knowledge_base_name FROM knowledge_chunks")
        kb_names = [row["knowledge_base_name"] for row in rows]
    finally:
        await conn.close()
    return kb_names


'''
插入chunks到知识库
'''
async def insert_chunks(request: KnowledgeBaseRequest):
    conn = await asyncpg.connect(Config.PG_CONN_STR)
    try:
        for idx, chunk in enumerate(request.chunks):
            embedding = get_embedding(chunk)
            # pgvector 需要 '(v1,v2,...,vn)' 字符串格式
            embedding_str = '[' + ','.join(str(x) for x in embedding) + ']'
            await conn.execute(
                """
                INSERT INTO knowledge_chunks (knowledge_base_name, chunk_number, chunk_text, embedding)
                VALUES ($1, $2, $3, $4::vector)
                """,
                request.knowledge_base_name,
                idx,
                chunk,
                embedding_str
            )
    finally:
        await conn.close()


async def get_chunks(knowledge_base_name: str, user_query: str):
    # 1. 获取query embedding
    query_embedding = get_embedding(user_query)
    # 转为 pgvector 兼容字符串
    query_embedding_str = '[' + ','.join(str(x) for x in query_embedding) + ']'
    conn = await asyncpg.connect(Config.PG_CONN_STR)
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
    return context_chunks