# Week 7 Solution: AI Chat Interface (Step-by-Step)

This guide provides a simple, step-by-step solution for building the Week 7 AI chat interface. It is designed for students and includes a talk track for instructors.

---

## 1. Create the Mock AI Chat Component

**File:** `src/components/MockAIChatSolution.tsx`

```tsx
import { useState } from 'react';

const mockAIResponse = (question) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (question.toLowerCase().includes('average')) {
        resolve('The average value in your dataset is 78.3.');
      } else if (question.toLowerCase().includes('trend')) {
        resolve('There is a positive trend in your data.');
      } else {
        resolve("That's an interesting question about your data.");
      }
    }, 1500);
  });
};

const MockAIChatSolution = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setMessages((prev) => [...prev, { type: 'user', content: input }]);
    setLoading(true);
    setInput('');
    try {
      const aiReply = await mockAIResponse(input);
      setMessages((prev) => [...prev, { type: 'ai', content: aiReply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { type: 'ai', content: 'Error getting AI response.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ minHeight: 200, border: '1px solid #ccc', padding: 16, marginBottom: 8 }}>
        {messages.length === 0 && <div>Ask me about your data!</div>}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.type === 'user' ? 'right' : 'left' }}>
            <b>{msg.type === 'user' ? 'You' : 'AI'}:</b> {msg.content}
          </div>
        ))}
        {loading && <div>AI is thinking...</div>}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        placeholder="Type your question..."
        style={{ width: '70%', marginRight: 8 }}
        disabled={loading}
      />
      <button onClick={handleSend} disabled={loading || !input.trim()}>
        Send
      </button>
    </div>
  );
};

export default MockAIChatSolution;
```

---

## Understanding msg.type: Step-by-Step

Each message in our chat is an object with a type property. This property tells us who sent the message—either the user or the AI.

### 1. Setting msg.type
- When the user sends a message:
  ```js
  { type: 'user', content: input }
  ```
- When the AI responds:
  ```js
  { type: 'ai', content: aiReply }
  ```

### 2. Why do we need it?
- The type property lets us tell the difference between user and AI messages. This way, we can style them differently—like putting user messages on the right and AI messages on the left.

### 3. Using msg.type in the UI
```jsx
<div style={{ textAlign: msg.type === 'user' ? 'right' : 'left' }}>
  <b>{msg.type === 'user' ? 'You' : 'AI'}:</b> {msg.content}
</div>
```
- If msg.type is 'user', the message is aligned right and labeled ‘You:’.
- If it’s 'ai', it’s aligned left and labeled ‘AI:’.

### 4. Summary
- By adding a type property to each message, we make our chat smarter and easier to read. It’s a simple trick that makes a big difference in user experience.

---

## 2. Add the Component to a Page

**File:** `src/pages/Index.tsx` (or your main page)

```tsx
import MockAIChatSolution from '@/components/MockAIChatSolution';

export default function HomePage() {
  return (
    <div>
      <h1>AI Chat Demo</h1>
      <MockAIChatSolution />
    </div>
  );
}
```

---
