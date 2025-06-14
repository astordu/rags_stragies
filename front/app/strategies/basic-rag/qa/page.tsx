import React, { useState, useRef, useEffect } from "react";



export default function BasicRAGChat() {
  const [messages, setMessages] = useState([
    { role: "system", content: "欢迎来到RAG问答对话窗口！" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamedMsg, setStreamedMsg] = useState("");
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>([]);
  const [selectedKB, setSelectedKB] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = 'http://localhost:8000/api/strategies/basic-rag'

  useEffect(() => {
    // 获取知识库列表
    fetch(`${API_BASE_URL}/knowledge-bases`)
      .then(res => res.json())
      .then(data => {
        setKnowledgeBases(data.knowledge_bases || []);
        if (data.knowledge_bases && data.knowledge_bases.length > 0) {
          setSelectedKB(data.knowledge_bases[0]);
        }
      });
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !selectedKB) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamedMsg("");

    const response = await fetch(`${API_BASE_URL}/qa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, knowledge_base_name: selectedKB }),
    });
    if (!response.body) return;
    const reader = response.body.getReader();
    let result = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      result += chunk;
      setStreamedMsg(result);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setMessages([...newMessages, { role: "assistant", content: result }]);
    setStreamedMsg("");
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="mb-2 flex items-center gap-2">
        <span>知识库：</span>
        <select
          className="border rounded p-1"
          value={selectedKB}
          onChange={e => setSelectedKB(e.target.value)}
          disabled={loading || knowledgeBases.length === 0}
        >
          {knowledgeBases.length === 0 && <option value="">无可用知识库</option>}
          {knowledgeBases.map(kb => (
            <option key={kb} value={kb}>{kb}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 p-4 bg-muted rounded-md">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === "user" ? "text-right" : "text-left"}>
            <span className="font-bold">{msg.role === "user" ? "你" : msg.role === "assistant" ? "AI" : "系统"}：</span>
            <span>{msg.content}</span>
          </div>
        ))}
        {loading && (
          <div className="text-left">
            <span className="font-bold">AI：</span>
            <span>{streamedMsg}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="flex gap-2 mt-4"
        onSubmit={e => {
          e.preventDefault();
          if (!loading) handleSend();
        }}
      >
        <input
          className="flex-1 border rounded p-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="请输入你的问题..."
          disabled={loading}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          type="submit"
          disabled={loading || !input.trim() || !selectedKB}
        >
          发送
        </button>
      </form>
    </div>
  );
}
