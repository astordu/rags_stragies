import os


class Config:
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:8b")
    PG_CONN_STR = os.getenv("PG_CONN_STR", "postgresql://postgres:postgres@localhost:5432/postgres")
    