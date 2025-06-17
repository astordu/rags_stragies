import asyncio
from app.common.utils import get_embedding
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.api_basic_rag import router as basic_rag_router
from app.api.api_semantic_similarity import router as semantic_similarity_router
from app.common.config import Config
import asyncpg

app = FastAPI(title="RAG API", description="RAG系统后端API")
# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(basic_rag_router)
app.include_router(semantic_similarity_router)

async def init_database():
    conn = await asyncpg.connect(Config.PG_CONN_STR)
    try:
        # 1, 测试数据库连接
        # 2, 开启向量功能
        # 3，创建数据库表，如果不存在创建，存在则不创建
        create_basic_chunks_table_sql = """
            CREATE EXTENSION IF NOT EXISTS vector;
            CREATE TABLE IF NOT EXISTS knowledge_chunks (
                id SERIAL PRIMARY KEY,
                knowledge_base_name TEXT NOT NULL,
                chunk_number INTEGER NOT NULL,
                chunk_text TEXT NOT NULL,
                embedding VECTOR(1024) -- 这里假设你的 embedding 维度为 1024
            );
            CREATE TABLE IF NOT EXISTS semantic_knowledge_chunks(
                id SERIAL NOT NULL,
                knowledge_base_name varchar(255) NOT NULL,
                chunk_number integer NOT NULL,
                chunk_text text NOT NULL,
                embedding vector(1024)
            );
        """
        await conn.execute(create_basic_chunks_table_sql)
    except Exception as e:
        raise e
    finally:
        await conn.close()

def test_model():
    get_embedding("hello")



if __name__ == "__main__":
    # 1、初始化数据库
    asyncio.run(init_database())
    # 2、测试模型
    test_model()
    # 5、启动服务
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
