import traceback
from app.repository.rag_repository import get_semantic_chunks, get_semantic_knowledge_names, insert_semantic_chunks
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from app.common.utils import stream_response
from langchain_experimental.text_splitter import SemanticChunker
from langchain.embeddings.base import Embeddings
from datetime import datetime
from app.model.models import SplitResponse, KnowledgeBaseResponse, KnowledgeBaseRequest, KnowledgeBaseListResponse
import json

router = APIRouter()

module_path = '/api/strategies/semantic-similarity'

class LocalEmbeddings(Embeddings):
    def embed_documents(self, texts):
        # 批量嵌入
        from app.common.utils import get_embedding
        return [get_embedding(text) for text in texts]
    def embed_query(self, text):
        from app.common.utils import get_embedding
        return get_embedding(text)

# 路由
@router.post(f"{module_path}/split", response_model=SplitResponse)
async def split_document(
    file: UploadFile = File(...),
    breakpoint_threshold_type: str = Form("percentile"),
    breakpoint_threshold_amount: float = Form(95),
):
    """
    文档切分接口 - 使用语义相似度进行切分
    """
    try:
        # 读取文件内容
        content = await file.read()
        text = content.decode('utf-8')

        # 使用 SemanticChunker 进行语义切分
        text_splitter = SemanticChunker(
            LocalEmbeddings(),
            breakpoint_threshold_type=breakpoint_threshold_type,  # 可选: percentile, stddev, interquartile, gradient
            breakpoint_threshold_amount=breakpoint_threshold_amount,
            buffer_size=1
        )
        docs = text_splitter.create_documents([text])
        chunks = [doc.page_content for doc in docs]
        return {
            "success": True,
            "chunks": chunks,
            "metadata": {
                "fileName": file.filename,
                "fileSize": len(content),
                "splitter": "SemanticChunker",
                "breakpoint_type": breakpoint_threshold_type,
                "breakpoint_amount": breakpoint_threshold_amount,
                "totalChunks": len(chunks),
                "timestamp": datetime.now().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(f"{module_path}/knowledge-bases", response_model=KnowledgeBaseListResponse)
async def get_knowledge_bases():
    """
    获取所有知识库名称
    """
    try:
        knowledge_bases = await get_semantic_knowledge_names()
        return {"knowledge_bases": knowledge_bases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(f"{module_path}/upload-to-knowledge-base")
async def upload_to_knowledge_base(request: KnowledgeBaseRequest):
    """
    将切分后的文档上传到知识库
    """
    try:
        await insert_semantic_chunks(request)
        return {"message": "Successfully uploaded to knowledge base"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(f"{module_path}/qa")
async def rag_qa_api(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    knowledge_base_name = data.get("knowledge_base_name")
    if not knowledge_base_name:
        raise HTTPException(status_code=400, detail="knowledge_base_name is required")
    if not messages or not messages[-1].get("content"):
        raise HTTPException(status_code=400, detail="No user query found")
    user_query = messages[-1]["content"]

    # 1. 获取context chunks
    context_chunks = await get_semantic_chunks(knowledge_base_name, user_query)

    # 2. 拼接context，插入到messages最前面
    context_text = "\n\n".join([f"资料[{i+1}] {chunk}" for i, chunk in enumerate(context_chunks)])
    context_message = {"role": "system", "content": f"参考资料：\n{context_text}"}
    new_messages = [context_message] + messages

    # 3. 返回context_chunks信息
    async def generate():
        yield f"data: {json.dumps({'type': 'context', 'chunks': context_chunks})}\n\n"
        async for chunk in stream_response(new_messages):
            yield chunk

    return StreamingResponse(generate(), media_type="text/event-stream")
