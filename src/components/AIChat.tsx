// src/components/AIChat.tsx
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Bot, User, Send, TrendingUp } from "lucide-react";

const API_URL = "http://localhost:4000/api/messages";

interface AIChatProps {
  csv_data?: Record<string, any>[];
  fitResult?: any;
}

interface ChatMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

const getSessionId = (): string => {
  let id = sessionStorage.getItem("dataChatSessionId");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("dataChatSessionId", id);
  }
  return id;
};

const AIChat: React.FC<AIChatProps> = ({ csv_data = [], fitResult = null }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(getSessionId);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 0,
          type: "ai",
          content: `Hello! I am ready to chat about your data. (Session: ${sessionId.substring(0, 8)}...)`,
          timestamp: new Date(),
        },
      ]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate dynamic suggestion questions
  const getDynamicSuggestions = () => {
    const baseSuggestions = [
      "What trends do you see?",
      "What's the average?",
      "Any outliers?",
      "Explain the data"
    ];

    // Add model analysis questions if fit result exists
    if (fitResult) {
      return [
        "Analyze model fitting results",
        `Explain parameters of ${fitResult.modelName}`,
        "Which temperature has the best fit?",
        "Predict future trends based on fitting",
        ...baseSuggestions
      ];
    }

    return baseSuggestions;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: csv_data,
          text: currentInput,
          sessionId,
          fitResult: fitResult,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: data.text || "No response from AI.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI response error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          content: "AI service is unavailable. Check server logs.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = getDynamicSuggestions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Data Assistant
          {fitResult && (
            <Badge variant="secondary" className="ml-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              Model Fitted
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ask questions about your dataset.</p>
              {fitResult && (
                <p className="text-sm mt-2 text-blue-600">
                  Now you can ask about {fitResult.modelName} fitting results
                </p>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    msg.type === "user" ? "bg-blue-600 text-white" : "bg-white border shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.type === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    <span className="text-xs opacity-75">
                      {msg.type === "user" ? "You" : "AI Assistant"}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border shadow-sm max-w-xs px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4" />
                  <span className="text-xs opacity-75">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Ask about your data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => setInput(suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>

        {/* Fit result info panel */}
        {fitResult && (
          <div className="p-3 bg-blue-50 rounded-md text-xs">
            <div className="font-semibold text-blue-800 mb-1">Current Fitted Model:</div>
            <div className="space-y-1 text-blue-700">
              <div><span className="font-medium">Model:</span> {fitResult.modelName}</div>
              <div><span className="font-medium">R²:</span> {fitResult.rSquared?.toFixed(4)}</div>
              {fitResult.parameters?.averageRSquared && (
                <div><span className="font-medium">Average R²:</span> {fitResult.parameters.averageRSquared.toFixed(4)}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIChat;