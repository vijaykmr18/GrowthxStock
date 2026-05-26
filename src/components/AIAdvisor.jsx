import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, RefreshCw } from 'lucide-react';

export default function AIAdvisor({ holdings, triggerRefresh }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelName, setModelName] = useState('');
  const scrollRef = useRef(null);

  // Run initial audit on load
  const runInitialAudit = async () => {
    setLoading(true);
    // Add welcome loading notice
    const loadingMessageId = Date.now();
    setMessages([
      {
        id: loadingMessageId,
        role: 'assistant',
        text: 'AetherAI is analyzing your diversification, asset weights, and profit margins... Please wait.',
        isLoading: true
      }
    ]);

    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: null })
      });

      if (res.ok) {
        const data = await res.json();
        setModelName(data.model);
        setMessages([
          {
            id: Date.now(),
            role: 'assistant',
            text: data.content,
            isMarkdown: true
          }
        ]);
      } else {
        throw new Error('Audit endpoint returned error status.');
      }
    } catch (err) {
      console.error('Audit failed:', err);
      setMessages([
        {
          id: Date.now(),
          role: 'assistant',
          text: '### ⚠️ Connection Interrupted\n\nCould not perform portfolio analysis. Please verify your internet connection or verify your OpenRouter API Key in `.env`.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runInitialAudit();
  }, [triggerRefresh]); // re-run audit if user requests refresh or transactions change

  // Autoscroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setLoading(true);

    const userMsgId = Date.now();
    const assistantMsgId = Date.now() + 1;

    // Append user message and loading skeleton
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: userText },
      { id: assistantMsgId, role: 'assistant', text: '', isLoading: true }
    ]);

    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => 
          m.id === assistantMsgId 
            ? { ...m, text: data.content, isLoading: false, isMarkdown: true } 
            : m
        ));
      } else {
        throw new Error('Failed to generate response');
      }
    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === assistantMsgId 
          ? { ...m, text: 'Sorry, I encountered an issue accessing wealth suggestions right now. Please try again.', isLoading: false } 
          : m
      ));
    } finally {
      setLoading(false);
    }
  };

  // Simple and robust parser for markdown inside chat
  const parseMarkdown = (text) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Header conversions
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  return (
    <div className="glass-card ai-advisor-panel">
      <div className="ai-header">
        <div className="ai-header-title">
          <Sparkles size={16} color="var(--accent-cyan)" />
          <span>AetherAI Financial Advisor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {modelName && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              {modelName.split('/').pop()}
            </span>
          )}
          <button 
            onClick={runInitialAudit} 
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Refresh Audit"
          >
            <RefreshCw size={12} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      <div className="ai-scroll-area" ref={scrollRef}>
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`message-bubble ${m.role === 'user' ? 'message-user' : 'message-assistant'}`}
          >
            {m.isLoading ? (
              <div className="loading-dots">
                <Bot size={14} style={{ marginRight: '8px', color: 'var(--accent-cyan)' }} />
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : m.isMarkdown ? (
              <div dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }} />
            ) : (
              <div>{m.text}</div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="ai-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={loading ? 'Advisor is thinking...' : 'Ask about your risk exposure...'}
          className="ai-input"
          disabled={loading}
        />
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ padding: '0.75rem', borderRadius: '8px' }}
          disabled={loading || !input.trim()}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
