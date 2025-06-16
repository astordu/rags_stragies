import React, { useState, useRef, useEffect, ReactNode } from "react";
import ReactMarkdown from "react-markdown";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

interface Message {
  role: string;
  content: string;
  context?: string[];
}

// 添加Modal组件
const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">检索</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// 自动编号引用 [] 为 [1]、[2]、[3] ...
function autoNumberReferences(content: string) {
  let refIdx = 1;
  return content.replace(/\[\]/g, () => `[${refIdx++}]`);
}

export default function BasicRAGChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: `
回答用户的问题必须附带引用索引。


**_引用规则：_**

- 必须在每个使用搜索结果的句子后面直接引用。
- 使用以下方法引用搜索结果：在相应句子末尾用方括号括起相关材料结果的索引,。例如："冰的密度小于水[1]。"
- 每个索引都应该用单独的方括号括起来，不要在单个括号组中包含多个索引。
- 在最后一个词和引用之间不要留空格。
- 每个句子最多引用三个相关材料，选择最相关的材料。
- 不得在答案末尾包含参考文献部分、来源列表或长引用列表。
- 请使用提供的材料结果回答查询，但不要逐字复制受版权保护的材料。
- 如果材料为空或无帮助，请尽可能用现有知识回答查询。

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
  const [selectedMessageContext, setSelectedMessageContext] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    let currentContextChunks: string[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      try {
        const data = JSON.parse(chunk.replace('data: ', ''));
        if (data.type === 'context') {
          currentContextChunks = data.chunks;
          continue;
        }
      } catch (e) {
        result += chunk;
        setStreamedMsg(result);
      }
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setMessages([...newMessages, { role: "assistant", content: result, context: currentContextChunks }]);
    setStreamedMsg("");
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-white">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50">
        {messages.filter(msg => msg.role !== "system").map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-start`}>
            {msg.role !== "user" && (
              <span className="text-2xl mr-2">
                {msg.role === "assistant" && "🤖"}
              </span>
            )}
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === "user" 
                ? "bg-blue-500 text-white" 
                : "bg-white border border-gray-200"
            } relative`}>
              <div className="text-sm">
                <ReactMarkdown components={{
                  a: ({node, ...props}) => <span {...props} />
                }}>{autoNumberReferences(msg.content)}</ReactMarkdown>
              </div>
              {msg.role === "assistant" && msg.context && msg.context.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedMessageContext(msg.context || []);
                    setIsModalOpen(true);
                  }}
                  className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  •••
                </button>
              )}
            </div>
            {msg.role === "user" && (
              <span className="text-2xl ml-2">🧑</span>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-start">
            <span className="text-2xl mr-2">🤖</span>
            <div className="max-w-[80%] rounded-lg p-3 bg-white border border-gray-200 relative">
              <div className="text-sm">
                <ReactMarkdown components={{
                  a: ({node, ...props}) => <span {...props} />
                }}>{autoNumberReferences(streamedMsg)}</ReactMarkdown>
              </div>
              {contextChunks.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedMessageContext(contextChunks);
                    setIsModalOpen(true);
                  }}
                  className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  •••
                </button>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="space-y-2">
          {selectedMessageContext.map((chunk, index) => (
            <div key={index} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-semibold text-blue-600 mr-2">[{index + 1}]</span>
              {chunk}
            </div>
          ))}
        </div>
      </Modal>

      <form
        className="flex gap-3 p-4 border-t border-gray-200 bg-white sticky bottom-0"
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
