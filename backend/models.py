from pydantic import BaseModel
from typing import List, Optional

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