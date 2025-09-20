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

const QUICK_RESPONSES: string[] = [];

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
      // Prepare conversation history for API
      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .slice(-4) // Keep last 4 messages for context
        .map(m => ({ role: m.role, content: m.content }));

      // Call the API endpoint
      const response = await fetch('/api/playground/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          problem: input,
          conversationHistory
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

      // If we've identified a service and have had enough conversation, add a recommendation
      if (data.solution && messageCount >= 3) {
        setTimeout(() => {
          const serviceName = SERVICE_NAMES[data.solution] || data.service;
          const savingsAmount = data.savings?.toLocaleString() || '25,000';
          
          let recommendationMessage = `Based on what you've told me about your `;
          
          // Customize based on the business type mentioned
          const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase()).join(' ');
          if (userMessages.includes('salon') || userMessages.includes('hair') || userMessages.includes('beauty')) {
            recommendationMessage += `salon, our ${serviceName} service would be perfect. We've helped similar salons save £${savingsAmount}+ annually by automating appointment bookings and client reminders.`;
          } else if (userMessages.includes('restaurant')) {
            recommendationMessage += `restaurant, our ${serviceName} service would transform your operations. We've helped restaurants like yours save £${savingsAmount}+ annually with automated reservations and order management.`;
          } else if (userMessages.includes('retail') || userMessages.includes('shop')) {
            recommendationMessage += `retail business, our ${serviceName} service is ideal. Similar shops save £${savingsAmount}+ annually with our AI customer service and inventory management.`;
          } else if (userMessages.includes('plumb') || userMessages.includes('trade') || userMessages.includes('electric')) {
            recommendationMessage += `trade business, our ${serviceName} service would streamline everything. Tradespeople save £${savingsAmount}+ annually with automated quotes and job scheduling.`;
          } else {
            recommendationMessage += `business challenges, our ${serviceName} service can help you save £${savingsAmount}+ annually through intelligent automation.`;
          }
          
          recommendationMessage += ` Would you like to see exactly how this would work for your business?`;
          
          setMessages(prev => [...prev, {
            role: 'system',
            content: recommendationMessage,
            timestamp: new Date()
          }]);
        }, 1500);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Check if it's a network error or API error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Error details:', errorMessage);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Based on what you've told me, most businesses like yours save 20+ hours weekly with our automation services. Would you like to learn more?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
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
                  ? 'bg-gold/10 border border-gold/30 text-deep-space rounded-tr-2xl rounded-br-2xl rounded-bl-2xl'
                  : 'bg-gray-100 text-deep-space rounded-tr-2xl rounded-br-2xl rounded-bl-2xl'
              } px-4 py-3`}
            >
              <p className="text-sm md:text-base">{message.content}</p>
              
              {message.service && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <a
                    href={SERVICE_LINKS[message.service as keyof typeof SERVICE_LINKS] || '/services'}
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium">Learn More →</span>
                  </a>
                </div>
              )}
              
              {message.role === 'system' && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="/#contact"
                      className="bg-gold hover:bg-gold/90 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm shadow-lg hover:shadow-xl"
                    >
                      Yes, Show Me How →
                    </a>
                    <a
                      href="/services"
                      className="bg-white hover:bg-gray-50 text-deep-space font-semibold px-4 py-2 rounded-lg transition-all text-sm border border-gray-200"
                    >
                      View All Services
                    </a>
                  </div>
                  <p className="text-xs text-gray-600">
                    💡 <strong>Free consultation includes:</strong> Custom AI strategy for your business • ROI analysis • Implementation roadmap
                  </p>
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

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-gray-100">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">
            What's your biggest business challenge? Or tell me what industry you're in:
          </p>
        </div>
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