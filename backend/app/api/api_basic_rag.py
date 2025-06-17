import traceback
from app.common.config import Config
from app.repository.rag_repository import get_basic_chunks, get_basic_knowledge_names, insert_chunks
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from app.common.utils import stream_response
from langchain.text_splitter import RecursiveCharacterTextSplitter
from fastapi import UploadFile, File, Form, HTTPException
from datetime import datetime
from app.model.models import SplitResponse, KnowledgeBaseResponse, KnowledgeBaseRequest
import json

router = APIRouter()

module_path = '/api/strategies/basic-rag'

# 路由
@router.post(f"{module_path}/split", response_model=SplitResponse)
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
            # separators=["\n\n", "\n", "。", "！", "？", ".", "!", "?", " ", ""],
            separators=separator.split(","),
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

@router.post(f"{module_path}/upload-to-knowledge-base", response_model=KnowledgeBaseResponse)
async def upload_to_knowledge_base(request: KnowledgeBaseRequest):
    """
    上传到知识库接口
    """
    try:
        # 连接PostgreSQL
        await insert_chunks(request)
        return {
            "success": True,
            "message": f"成功上传 {len(request.chunks)} 个片段到知识库 {request.knowledge_base_name}"
        }
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=traceback.format_exc())


@router.get(f"{module_path}/knowledge-bases")
async def list_knowledge_bases():
    """
    查询所有已存在的知识库名称
    """
    try:
        kb_names = await get_basic_knowledge_names()
        return JSONResponse(content={"knowledge_bases": kb_names})
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
    context_chunks = await get_basic_chunks(knowledge_base_name, user_query)

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
