import { useState, useRef, useEffect } from 'react';
import './App.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {

  const isUnderMaintenance = true;

  const [isOceanMode, setIsOceanMode] = useState(() => {
    const savedTheme = localStorage.getItem("neoai-theme");
    return savedTheme === "true"; 
  });

  useEffect(() => {
    localStorage.setItem("neoai-theme", isOceanMode);
  }, [isOceanMode]);

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

  const [messages, setMessages] = useState(() => {
    const savedChats = localStorage.getItem("neoai-chat");
    if (savedChats) {
      return JSON.parse(savedChats);
    }
    return []; 
  });

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isResetting, setIsResetting] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      const response = await fetch("https://neoai-backend-9ubx.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg.text, 
          sessionId: sessionId
        }),
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
    if (isResetting) return;

    setIsResetting(true);
    try {
      const response = await fetch("https://neoai-backend-9ubx.onrender.com/reset", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId }) 
      });
      
      if (response.ok) {
        setMessages([]); 
        setInputText("");
        localStorage.removeItem("neoai-chat");
      }
    } catch (error) {
      console.error("Failed to reset chat:", error);
    }
    finally {
      setIsResetting(false); // Turn off the loading state once finished
    }
  };


if (isUnderMaintenance) {
    return (
      <div className="maintenance-container">
        <div className="maintenance-icon">⚙️</div>
        <h1 className="maintenance-heading">NeoAI Under Maintenance</h1>
        <p className="maintenance-text">
          We are currently fine-tuning our AI servers to optimize performance. Our services will be fully restored shortly. Thank you for your patience!
        </p>
        <div className="maintenance-footer">
          © 2026 NeoAI Inc.
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${isOceanMode ? 'ocean-mode' : ''}`}>
      
      <div className="sidebar">
        <div className="logo">NeoAI</div>
        <button className="new-chat-btn desktop-new-chat-btn" onClick={handleReset}>New chat</button>
        
        <button 
          className="theme-toggle-btn" 
          onClick={() => setIsOceanMode(!isOceanMode)}
        >
          {isOceanMode ? 'Light Theme' : 'Dark Theme'}
        </button>
      </div>

      <div className="main-content">
        <div className="chat-box">
          
          {messages.length === 0 && (
            <div className="empty-chat-state">
              <h2>Hi, how can I help you?</h2>
              <p>Experience premium AI assistance crafted for productivity.</p>
              <p> Ask me anything to get started.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}>
              <div className={`avatar ${msg.sender === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                {msg.sender === 'user' ? 'U' : 'Neo'}
              </div>
              <div className={`message-content ${msg.sender === 'user' ? 'user-content' : 'bot-content'}`}>
                
                {msg.sender === 'user' ? (msg.text ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                )}
              </div>      
            </div>
          ))}

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
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-wrapper">
          {/* The Mobile Floating Button */}
          <button 
          className={`new-chat-fab ${isResetting ? 'rotating' : ''}`} 
          onClick={handleReset} 
          title="Start a new chat"
          disabled={isResetting || isLoading}
        >
          {isResetting ? "⏳" : "+"}
        </button>
          
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

          <div className="app-footer">
            <p>NeoAI can make mistakes.Verify impt info's.</p>
            <p>©2026 NeoAI Inc.All rights reserved-RoshanAk</p>
          </div>


        </div>

      </div>
    </div>
  );
}

export default App;