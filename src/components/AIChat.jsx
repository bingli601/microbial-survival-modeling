import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Bot, User, Send, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:4000/api/messages';

/**
 * Utility function to generate a stable UUID for the session, stored in session storage.
 * This ensures the backend (server.js) maintains the conversation history for this session.
 */
const getSessionId = () => {
    let id = sessionStorage.getItem('dataChatSessionId');
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem('dataChatSessionId', id);
    }
    return id;
};

// Renamed the component to reflect it is no longer a mock
const AIChat = ({ csv_data = [] }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(getSessionId); // Initialize and store the session ID
  
  const messagesEndRef = useRef(null);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Initial message for the user
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ 
          id: 0,
          type: 'ai', 
          content: `Hello! I'm ready to chat about anything. (Session ID: ${sessionId.substring(0, 8)}...)`, 
          timestamp: new Date()
      }]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    
    // 1. Add user message and clear input
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // 2. POST to the actual backend endpoint defined in server.js
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            data: csv_data,
            text: currentInput, 
            sessionId: sessionId // Send session ID for history tracking
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 3. Process the real AI response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        // The backend (server.js) returns the response in { text: "..." }
        content: data.text || "I couldn't get a valid text response from the AI model.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Sorry, I'm having trouble connecting to the AI service right now. Please check the backend (server.js) logs!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Data Assistant (Mock)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chat Messages */}
          <div className="h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded">
              {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ask me anything about your data!</p>
                  <p className="text-sm mt-1">Try: "What's the average?" or "Do you see any trends?"</p>
              </div>
              ) : (
              messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      msg.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border shadow-sm'
                  }`}>
                      <div className="flex items-center gap-2 mb-1">
                      {msg.type === 'user' ? (
                          <User className="h-4 w-4" />
                      ) : (
                          <Bot className="h-4 w-4" />
                      )}
                      <span className="text-xs opacity-75">
                          {msg.type === 'user' ? 'You' : 'AI Assistant'}
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
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">Thinking...</span>
                  </div>
                  </div>
              </div>
              )}
          </div>
          {/* Input Area */}
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
          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2">
              {["What trends do you see?", "What's the average?", "Any outliers?", "Explain the data"].map(suggestion => (
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
          </CardContent>
      </Card>
    );
};

export default AIChat;
