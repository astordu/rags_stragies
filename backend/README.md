# RAG系统后端API

这是RAG（检索增强生成）系统的后端API服务。

## 功能特性

- 文档切分：支持多种格式文档的上传和智能切分
- 知识库管理：支持将切分后的文档片段存储到知识库
- 智能问答：基于知识库内容进行问答

## 安装

1. 确保已安装Python 3.9+
2. 安装依赖：
```bash
pip install poetry
poetry install
```

## 运行

```bash
poetry run python main.py
```

服务将在 http://localhost:8000 启动

## API文档

启动服务后，访问 http://localhost:8000/docs 查看完整的API文档。

## 主要接口

1. `/api/split` - 文档切分
2. `/api/upload-to-knowledge-base` - 上传到知识库
3. `/api/chat` - 智能问答