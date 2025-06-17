import asyncpg
from app.common.config import Config
from app.common.utils import get_embedding
from app.model.models import KnowledgeBaseRequest


'''
   查询数据工具函数
'''
async def query_data(sql:str, params:tuple=None):
    conn = await asyncpg.connect(Config.PG_CONN_STR)
    try:
        rows = await conn.fetch(sql, *(params or ()))
    finally:
        await conn.close()
    return rows


'''
执行数据工具函数
'''
async def execute_data(sql:str, params:tuple=None):
    conn = await asyncpg.connect(Config.PG_CONN_STR)
    try:
        await conn.execute(sql, *(params or ()))
    finally:
        await conn.close()


'''
获取所有知识库名称
'''
async def get_basic_knowledge_names():
    rows = await query_data("SELECT DISTINCT knowledge_base_name FROM knowledge_chunks")
    return [row["knowledge_base_name"] for row in rows]


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


async def get_basic_chunks(knowledge_base_name: str, user_query: str):
    # 1. 获取query embedding
    query_embedding = get_embedding(user_query)
    # 转为 pgvector 兼容字符串
    query_embedding_str = '[' + ','.join(str(x) for x in query_embedding) + ']'
    
    sql = """
        SELECT chunk_text
        FROM knowledge_chunks
        WHERE knowledge_base_name = $1
        ORDER BY (embedding <#> $2::vector) ASC
        LIMIT 7
    """
    rows = await query_data(sql, (knowledge_base_name, query_embedding_str))
    return [row["chunk_text"] for row in rows]


'''
获取所有 semantic_knowledge_chunks 知识库名称
'''
async def get_semantic_knowledge_names():
    rows = await query_data("SELECT DISTINCT knowledge_base_name FROM semantic_knowledge_chunks")
    return [row["knowledge_base_name"] for row in rows]


'''
插入chunks到 semantic_knowledge_chunks
'''
async def insert_semantic_chunks(request: KnowledgeBaseRequest):
    conn = await asyncpg.connect(Config.PG_CONN_STR)
    try:
        for idx, chunk in enumerate(request.chunks):
            embedding = get_embedding(chunk)
            embedding_str = '[' + ','.join(str(x) for x in embedding) + ']'
            await conn.execute(
                """
                INSERT INTO semantic_knowledge_chunks (knowledge_base_name, chunk_number, chunk_text, embedding)
                VALUES ($1, $2, $3, $4::vector)
                """,
                request.knowledge_base_name,
                idx,
                chunk,
                embedding_str
            )
    finally:
        await conn.close()


async def get_semantic_chunks(knowledge_base_name: str, user_query: str):
    # 1. 获取query embedding
    query_embedding = get_embedding(user_query)
    # 转为 pgvector 兼容字符串
    query_embedding_str = '[' + ','.join(str(x) for x in query_embedding) + ']'
    
    sql = """
        SELECT chunk_text
        FROM semantic_knowledge_chunks
        WHERE knowledge_base_name = $1
        ORDER BY (embedding <#> $2::vector) ASC
        LIMIT 7
    """
    rows = await query_data(sql, (knowledge_base_name, query_embedding_str))
    return [row["chunk_text"] for row in rows]