import os
from app.common.config import Config
from openai import OpenAI
import requests
import httpx
import asyncio
import json


def get_embedding(content):
    response = requests.post(
        "http://localhost:11434/api/embed",
        json={"model": "bge-m3", "input": content, "dimensions": 1024}
    )
    embedding = response.json()["embeddings"][0]
    return embedding


'''
请求大模型，并获取流式响应
返回流式响应的生成器
'''
async def stream_response(new_messages):
    url = f"{Config.OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": Config.OLLAMA_MODEL,
        "messages": new_messages,
        "stream": True
    }
    headers = {"Content-Type": "application/json"}
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

# 使用示例
if __name__ == "__main__":
    text = '衣服的质量杠杠的，很漂亮，不枉我等了这么久啊，喜欢，以后还来这里买'
    # embedding = get_embedding(text)
    # print(f"输入文本: {text}")
    # print(f"Embedding维度: {len(embedding)}")
    # print(f"Embedding前5个值: {embedding[:5]}")
    embedding = get_embedding(text)
    print(f"输入文本: {text}")
    print(f"Embedding维度: {len(embedding)}")
    print(f"Embedding前5个值: {embedding[:5]}")
