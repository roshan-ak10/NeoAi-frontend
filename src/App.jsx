import { useState, useRef, useEffect } from 'react';
import './App.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  //1. SESSION ID: Give the user a unique ID (with the secure fallback)
  const [sessionId] = useState(() => {
    let id = localStorage.getItem("neoai-session-id");
    if (!id) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        id = crypto.randomUUID();
      } else {
        id = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
      }
      localStorage.setItem("neoai-session-id", id);
    }
    return id;
  });

  //2. MEMORY: Load chat history from localStorage on startup
  const [messages, setMessages] = useState(() => {
    const savedChats = localStorage.getItem("neoai-chat");
    if (savedChats) {
      return JSON.parse(savedChats);
    }
    return [
      { text: "Hello! I am your NeoAi. assistant. What's on your mind today?", sender: "bot" }
    ];
  });

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  //3. SAVE TO MEMORY: Every time messages update, save to browser
  useEffect(() => {
    localStorage.setItem("neoai-chat", JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg = { text: inputText, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      //4. SEND ID TO BACKEND: Attach sessionId to the chat request
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, sessionId: sessionId }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.reply, sender: "bot" }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "Error connecting to backend server. Is it running?", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleReset = async () => {
    try {
      // 🧹 5. RESET ID: Tell backend whose memory to wipe
      const response = await fetch("http://localhost:3000/reset", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId }) 
      });
      
      if (response.ok) {
        alert("Memory wiped!");
        setMessages([
          { text: "Hello! I am your NeoAi. assistant. What's on your mind today?", sender: "bot" }
        ]);
      }
    } catch (error) {
      console.error("The signal was lost at sea:", error);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">NeoAI</div>
        <button className="new-chat-btn" onClick={handleReset}>+ New chat</button>
      </div>

      {/* Main Chat Area */}
      <div className="main-content">
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}>
              <div className={`avatar ${msg.sender === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                {msg.sender === 'user' ? 'U' : 'Neo'}
              </div>
              <div className={`message-content ${msg.sender === 'user' ? 'user-content' : 'bot-content'}`}>
              {msg.sender === 'user' ? (msg.text ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>)}
              </div>      
            </div>
          ))}

          {/* 6. THINKING ANIMATION: Shows up while waiting for backend */}
          {isLoading && (
            <div className="message-row bot-row">
              <div className="avatar bot-avatar">Neo</div>
              <div className="message-content bot-content thinking-bubble">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
          
          {/* Invisible div to help with auto-scrolling */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="input-container">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind?..."
            disabled={isLoading}
          />
          <button 
            className="send-btn" 
            onClick={handleSendMessage}
            disabled={isLoading}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;