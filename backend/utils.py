import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),  # 如果您没有配置环境变量，请在此处用您的API Key进行替换
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"  # 百炼服务的base_url
)

def get_embedding(text: str) -> list:
    """
    获取文本的embedding向量
    
    Args:
        text (str): 需要转换为embedding的文本
        
    Returns:
        list: 文本的embedding向量
    """
    completion = client.embeddings.create(
        model="text-embedding-v4",
        input=text,
        dimensions=1024,  # 指定向量维度（仅 text-embedding-v3及 text-embedding-v4支持该参数）
        encoding_format="float"
    )
    
    return completion.data[0].embedding

# 使用示例
if __name__ == "__main__":
    text = '衣服的质量杠杠的，很漂亮，不枉我等了这么久啊，喜欢，以后还来这里买'
    embedding = get_embedding(text)
    print(f"输入文本: {text}")
    print(f"Embedding维度: {len(embedding)}")
    print(f"Embedding前5个值: {embedding[:5]}")