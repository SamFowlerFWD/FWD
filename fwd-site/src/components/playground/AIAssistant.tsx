import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  service?: string;
  savings?: number;
  timestamp: Date;
}

const SERVICE_LINKS = {
  automation: '/services/business-process-automation',
  website: '/services/ai-powered-websites',
  app: '/services/custom-app-development',
  hosting: '/services/ai-hosting-maintenance'
};

const SERVICE_NAMES = {
  automation: 'Business Process Automation',
  website: 'AI-Powered Website',
  app: 'Custom App Development',
  hosting: 'AI Hosting & Maintenance'
};

const INITIAL_QUESTIONS = [
  "What type of business do you run?",
  "What's your biggest time-waster right now?",
  "How many hours per week do you spend on repetitive tasks?",
  "What would you do with an extra 20 hours per week?"
];

const QUICK_RESPONSES = [
  "I run a retail business",
  "I manage a restaurant",
  "I own a service company",
  "We do consulting",
  "I need help with automation",
  "Our website needs work",
  "We need a custom app"
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm FWD's AI assistant. In just 2 minutes, I'll identify exactly how AI can transform your business. What type of business do you run?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || messageCount >= 5) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setMessageCount(prev => prev + 1);

    try {
      // Call the API endpoint
      const response = await fetch('/api/playground/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problem: input
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        service: data.solution,
        savings: data.savings,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If we've identified a service, add a follow-up
      if (response.service && messageCount >= 2) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'system',
            content: `Based on your answers, I recommend our ${SERVICE_NAMES[response.service]} service. This could save you approximately £${response.savings?.toLocaleString() || '30,000'} per year. Would you like to learn more or book a free consultation?`,
            timestamp: new Date()
          }]);
        }, 1500);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Based on what you've told me, most businesses like yours save 20+ hours weekly with our automation services. Would you like to learn more?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickResponse = (response: string) => {
    setInput(response);
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-ai-purple to-trust-blue text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
                  : message.role === 'system'
                  ? 'bg-urgent-amber/10 border border-urgent-amber/30 text-deep-space rounded-tr-2xl rounded-br-2xl rounded-bl-2xl'
                  : 'bg-gray-100 text-deep-space rounded-tr-2xl rounded-br-2xl rounded-bl-2xl'
              } px-4 py-3`}
            >
              <p className="text-sm md:text-base">{message.content}</p>
              
              {message.service && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <a
                    href={SERVICE_LINKS[message.service]}
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium">Learn More →</span>
                  </a>
                </div>
              )}
              
              {message.role === 'system' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="/#contact"
                    className="bg-urgent-amber hover:bg-urgent-amber/90 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm"
                  >
                    Book Free Consultation
                  </a>
                  <a
                    href="/services"
                    className="bg-white hover:bg-gray-50 text-deep-space font-semibold px-4 py-2 rounded-lg transition-all text-sm border border-gray-200"
                  >
                    View Services
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl px-4 py-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-ai-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-ai-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-ai-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Responses */}
      {messageCount < 3 && (
        <div className="px-6 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Quick responses:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_RESPONSES.slice(0, 4).map((response) => (
              <button
                key={response}
                onClick={() => handleQuickResponse(response)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-lg transition-colors"
              >
                {response}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-gray-100">
        {messageCount >= 5 ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Thanks for trying our AI assistant! Ready to take the next step?
            </p>
            <a
              href="/#contact"
              className="inline-block bg-gradient-to-r from-ai-purple to-trust-blue hover:from-ai-purple/90 hover:to-trust-blue/90 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Your Free Consultation
            </a>
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer here..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:border-ai-purple focus:outline-none transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-ai-purple to-trust-blue hover:from-ai-purple/90 hover:to-trust-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Send
            </button>
          </div>
        )}
        
        {messageCount > 0 && messageCount < 5 && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            {5 - messageCount} questions remaining • Your data is private and secure
          </p>
        )}
      </form>
    </div>
  );
}