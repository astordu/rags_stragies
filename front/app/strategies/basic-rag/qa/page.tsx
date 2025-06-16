import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function BasicRAGChat() {
  const [messages, setMessages] = useState([
    { role: "system", content: `
you must answer user query with citations.

**_Citations:_**

- You MUST cite search results used directly after each sentence it is used in.
- Cite search results using the following method. Enclose the index of the relevant search result in brackets at the end of the corresponding sentence. For example: "Ice is less dense than water[1]."
- Each index should be enclosed in its own brackets and never include multiple indices in a single bracket group.
- Do not leave a space between the last word and the citation.
- Cite up to three relevant sources per sentence, choosing the most pertinent search results.
- You MUST NOT include a References section, Sources list, or long list of citations at the end of your answer.
- Please answer the Query using the provided search results, but do not produce copyrighted material verbatim.
- If the search results are empty or unhelpful, answer the Query as well as you can with existing knowledge.

**Noted:**
speak in Chinese.
      ` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamedMsg, setStreamedMsg] = useState("");
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>([]);
  const [selectedKB, setSelectedKB] = useState<string>("");
  const [contextChunks, setContextChunks] = useState<string[]>([]);
  const [isContextExpanded, setIsContextExpanded] = useState(false);
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
    setContextChunks([]);

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
      try {
        const data = JSON.parse(chunk.replace('data: ', ''));
        if (data.type === 'context') {
          setContextChunks(data.chunks);
          continue;
        }
      } catch (e) {
        // 如果不是JSON，则作为普通文本处理
        result += chunk;
        setStreamedMsg(result);
      }
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setMessages([...newMessages, { role: "assistant", content: result }]);
    setStreamedMsg("");
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-white rounded-lg shadow-lg p-6">
      {contextChunks.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <div 
            className="flex items-center justify-between cursor-pointer mb-2 hover:bg-gray-100 p-2 rounded transition-colors"
            onClick={() => setIsContextExpanded(!isContextExpanded)}
          >
            <h3 className="font-semibold text-gray-800">召回的数据:</h3>
            <span className="text-gray-500 transition-transform duration-200">
              {isContextExpanded ? '▼' : '▶'}
            </span>
          </div>
          {isContextExpanded && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contextChunks.map((chunk, index) => (
                <div key={index} className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  {chunk}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-start`}>
            {msg.role !== "user" && (
              <span className="text-2xl mr-2">
                {msg.role === "assistant" && "🤖"}
                {msg.role === "system" && "⚙️"}
              </span>
            )}
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === "user" 
                ? "bg-blue-500 text-white" 
                : msg.role === "assistant" 
                ? "bg-white border border-gray-200" 
                : "bg-gray-100"
            }`}>
              <div className="text-sm">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
            {msg.role === "user" && (
              <span className="text-2xl ml-2">🧑</span>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-start">
            <span className="text-2xl mr-2">🤖</span>
            <div className="max-w-[80%] rounded-lg p-3 bg-white border border-gray-200">
              <div className="text-sm">
                <ReactMarkdown>{streamedMsg}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="flex gap-3 mt-4"
        onSubmit={e => {
          e.preventDefault();
          if (!loading) handleSend();
        }}
      >
        <select
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white w-48"
          value={selectedKB}
          onChange={e => setSelectedKB(e.target.value)}
          disabled={loading || knowledgeBases.length === 0}
        >
          {knowledgeBases.length === 0 && <option value="">无可用知识库</option>}
          {knowledgeBases.map(kb => (
            <option key={kb} value={kb}>{kb}</option>
          ))}
        </select>
        <input
          className="flex-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="请输入你的问题..."
          disabled={loading}
        />
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
          type="submit"
          disabled={loading || !input.trim() || !selectedKB}
        >
          发送
        </button>
      </form>
    </div>
  );
}
