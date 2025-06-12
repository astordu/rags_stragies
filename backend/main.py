from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
from pydantic import BaseModel
import os
from datetime import datetime
from langchain.text_splitter import RecursiveCharacterTextSplitter
from utils import get_embedding
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

# 数据模型
class ChatRequest(BaseModel):
    message: str
    chunks: Optional[List[str]] = None

class ChatResponse(BaseModel):
    success: bool
    response: str
    metadata: dict

class SplitResponse(BaseModel):
    success: bool
    chunks: List[str]
    metadata: dict

class KnowledgeBaseResponse(BaseModel):
    success: bool
    message: str

class KnowledgeBaseRequest(BaseModel):
    chunks: List[str]
    knowledge_base_name: str

# 路由
@app.post("/api/split", response_model=SplitResponse)
async def split_document(
    file: UploadFile = File(...),
    chunk_size: int = Form(1000),
    overlap: int = Form(200),
    separator: str = Form("\\n\\n,\\n")
):
    """
    文档切分接口
    """
    try:
        # 读取文件内容
        content = await file.read()
        text = content.decode('utf-8')
        
        # 使用 RecursiveCharacterTextSplitter 进行智能切分
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            separators=["\n\n", "\n", "。", "！", "？", ".", "!", "?", " ", ""],
            length_function=len,
        )
        
        chunks = text_splitter.split_text(text)
        
        return {
            "success": True,
            "chunks": chunks,
            "metadata": {
                "fileName": file.filename,
                "fileSize": len(content),
                "chunkSize": chunk_size,
                "overlap": overlap,
                "separator": separator,
                "totalChunks": len(chunks),
                "timestamp": datetime.now().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-to-knowledge-base", response_model=KnowledgeBaseResponse)
async def upload_to_knowledge_base(request: KnowledgeBaseRequest):
    """
    上传到知识库接口
    """
    try:
        # 连接PostgreSQL
        PG_CONN_STR = os.getenv("PG_CONN_STR", "postgresql://postgres:postgres@localhost:5432/postgres")
        conn = await asyncpg.connect(PG_CONN_STR)
        try:
            for idx, chunk in enumerate(request.chunks):
                embedding = get_embedding(chunk)
                await conn.execute(
                    """
                    INSERT INTO knowledge_chunks (knowledge_base_name, chunk_number, chunk_text, embedding)
                    VALUES ($1, $2, $3, $4)
                    """,
                    request.knowledge_base_name,
                    idx,
                    chunk,
                    embedding
                )
        finally:
            await conn.close()
        return {
            "success": True,
            "message": f"成功上传 {len(request.chunks)} 个片段到知识库 {request.knowledge_base_name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 