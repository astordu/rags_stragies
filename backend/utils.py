import os
from openai import OpenAI
import requests


def get_embedding(content):
    response = requests.post(
        "http://localhost:11434/api/embed",
        json={"model": "bge-m3", "input": content, "dimensions": 1024}
    )
    embedding = response.json()["embeddings"][0]
    return embedding

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