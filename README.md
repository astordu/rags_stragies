# 不花钱，测试 RAG 所有策略

> 但你需要动一动手


![项目展示](./front/public/showcase.png)

---

## 安装

### 1. 安装 pgvector 的 Docker 镜像

```bash
docker pull pgvector/pgvector:pg16

docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d pgvector/pgvector:pg16
```

### 2. 使用客户端连接 PostgreSQL 数据库

- **主机（host）**：localhost
- **端口（port）**：5432
- **用户名（user）**：postgres
- **密码（password）**：postgres
- **数据库名（database）**：postgres（默认）

#### 开启向量功能

```sql
CREATE EXTENSION vector;
```

#### 创建知识库表

```sql
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id SERIAL PRIMARY KEY,
  knowledge_base_name TEXT NOT NULL,
  chunk_number INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1024) -- 这里假设你的 embedding 维度为 1024
);
CREATE TABLE semantic_knowledge_chunks(
    id SERIAL NOT NULL,
    knowledge_base_name varchar(255) NOT NULL,
    chunk_number integer NOT NULL,
    chunk_text text NOT NULL,
    embedding vector(1024)
);
```

### 3. 下载 Ollama embedding

```bash
ollama pull bge-m3
```

### 4. 下载 Ollama 模型

```bash
ollama run qwen3:8b
```

### 5. 运行python后端程序

```bash
cd backend
uv pip install -r requirements.txt
python main.py
```

### 6. 运行前端程序

```bash
cd front
npm install
pnm run dev
```

---

## 技术栈

### 后端

- **FastAPI**：高性能的 Python Web 框架
- **LangChain**：用于构建 LLM 应用
- **Uvicorn**：ASGI 服务器
- **Poetry**：依赖管理

### 前端

- **Next.js**：React 框架
- **TypeScript**：类型安全的 JavaScript
- **Tailwind CSS**：样式框架
- **ESLint**：代码质量工具

---

## 项目结构

```text
.
├── backend/           # 后端服务
│   ├── main.py        # 主应用入口
│   └── requirements.txt
└── front/             # 前端应用
    ├── app/           # 页面组件
    ├── components/    # 可复用组件
    └── public/        # 静态资源
```
