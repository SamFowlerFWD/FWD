import React, { useState } from 'react';
import { trackMetric } from './ValueCounter';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Where is my order?",
  "I want a refund",
  "How long is shipping?",
  "Do you have this in stock?",
  "What's your return policy?"
];

export default function ChatbotDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: "Hi! I'm your shopping assistant. How can I help with your order today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || messageCount >= 3) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setMessageCount(prev => prev + 1);

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-4).map(msg => ({
        role: msg.role === 'bot' ? 'assistant' : 'user',
        content: msg.content
      }));

      const response = await fetch('/api/playground/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          conversationHistory 
        })
      });

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        role: 'bot',
        content: data.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Track metrics
      trackMetric({
        demosCompleted: 1,
        tokensUsed: data.tokens || 20,
        timeSaved: 3,
        potentialSavings: 50
      });
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "Sorry, I'm having connection issues. Please try again or email support@store.com.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
        <h3 className="text-lg font-bold">Retail Support Chatbot</h3>
        <p className="text-sm opacity-90">24/7 customer service assistant</p>
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {messageCount < 3 ? (
        <div className="p-4 border-t border-gray-100">
          <div className="mb-2">
            <div className="flex flex-wrap gap-1">
              {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Send
            </button>
          </form>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            {3 - messageCount} messages remaining • Powered by AI
          </p>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-700 mb-3">
            Automate your customer support with AI
          </p>
          <a
            href="/services/business-process-automation"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Learn More →
          </a>
        </div>
      )}
    </div>
  );
}