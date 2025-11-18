// chatInterface.tsx
import React, { useState, useEffect, useRef } from "react";
import { DataRow, DataInsight } from "@/types/data";
import { generateDataInsights } from "@/utils/dataAnalysis";

interface ChatInterfaceProps {
  data: DataRow[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ data }) => {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [insights, setInsights] = useState<DataInsight[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Generate initial insights when data is loaded
    if (data && data.length > 0) {
      const initialInsights = generateDataInsights(data);
      setInsights(initialInsights);
    }
  }, [data]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: input.trim() }]);
    const userMessage = input.trim();
    setInput("");

    // Generate simple AI response (mock)
    setTimeout(() => {
      const aiResponse = `Processed your message: "${userMessage}". ${insights.length ? `Here are some insights: ${insights.map(i => i.title).join(", ")}.` : ""}`;
      setMessages((prev) => [...prev, { role: "ai", content: aiResponse }]);
    }, 500);
  };

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-interface border rounded-md p-4 flex flex-col h-full bg-white">
      <div className="messages flex-1 overflow-y-auto mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message mb-2 p-2 rounded ${msg.role === "user" ? "bg-blue-100 text-blue-900 self-end" : "bg-gray-100 text-gray-900 self-start"}`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSend}
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
