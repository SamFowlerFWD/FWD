import React, { useState } from 'react';
import { trackMetric } from './ValueCounter';
import ChatbotDemo from './ChatbotDemo';
import DataExtractorDemo from './DataExtractorDemo';

interface DemoCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  component?: React.ComponentType;
}

const demos: DemoCard[] = [
  {
    id: 'email',
    title: 'Smart Email Responder',
    description: 'Generate professional email responses in seconds',
    icon: '✉️',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'product',
    title: 'Product Description Writer',
    description: 'Create compelling product descriptions instantly',
    icon: '📝',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'time',
    title: 'Time Savings Calculator',
    description: 'Calculate how much time AI could save you',
    icon: '⏱️',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'chatbot',
    title: 'AI Chatbot',
    description: 'Experience instant customer support',
    icon: '💬',
    color: 'from-green-500 to-green-600',
    component: ChatbotDemo
  },
  {
    id: 'extractor',
    title: 'Data Extractor',
    description: 'Extract data from documents instantly',
    icon: '📄',
    color: 'from-indigo-500 to-indigo-600',
    component: DataExtractorDemo
  }
];

export default function QuickDemos() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [emailTone, setEmailTone] = useState<'professional' | 'friendly' | 'urgent'>('professional');
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState<'electronics' | 'clothing' | 'home' | 'beauty' | 'sports'>('electronics');
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [generatedContent, setGeneratedContent] = useState('');

  const handleEmailDemo = async () => {
    try {
      const contexts = {
        professional: 'Customer asking about order status',
        friendly: 'Happy customer leaving positive feedback',
        urgent: 'Customer complaint about delayed shipping'
      };
      
      const response = await fetch('/api/playground/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: contexts[emailTone],
          tone: emailTone 
        })
      });
      const data = await response.json();
      setGeneratedContent(`${data.content}\n\n(Generated in ${data.tokens} tokens)`);
      trackMetric({ 
        demosCompleted: 1, 
        tokensUsed: data.tokens || 30,
        timeSaved: 5,
        potentialSavings: 100
      });
    } catch (error) {
      setGeneratedContent('Unable to generate email. Please try again.');
    }
  };

  const handleProductDemo = async () => {
    if (!productName.trim()) {
      setGeneratedContent('Please enter a product name first.');
      return;
    }
    
    try {
      const response = await fetch('/api/playground/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productName: productName,
          productType: productType,
          features: null
        })
      });
      const data = await response.json();
      setGeneratedContent(`${data.content}\n\n(Generated in ${data.tokens} tokens)`);
      trackMetric({ 
        demosCompleted: 1, 
        tokensUsed: data.tokens || 40,
        timeSaved: 10,
        potentialSavings: 200
      });
    } catch (error) {
      setGeneratedContent('Unable to generate product description. Please try again.');
    }
  };

  const calculateTimeSavings = () => {
    const hoursSaved = Math.round(hoursPerWeek * 0.9);
    const yearlySaved = hoursSaved * 52;
    const moneySaved = hoursSaved * 52 * 30; // £30/hour average
    
    setGeneratedContent(
      `Based on ${hoursPerWeek} hours per week of repetitive tasks:\n\n` +
      `⏰ Time Saved: ${hoursSaved} hours/week (${yearlySaved} hours/year)\n` +
      `💰 Money Saved: £${moneySaved.toLocaleString()}/year\n` +
      `🚀 ROI: ${Math.round((moneySaved / 799) * 100)}% in first year\n\n` +
      `With FWD's automation, you'll reclaim ${hoursSaved} hours every week to focus on growth.`
    );
    
    trackMetric({ 
      demosCompleted: 1, 
      tokensUsed: 0, // No API usage for calculator
      timeSaved: hoursSaved * 60, // Convert to minutes
      potentialSavings: Math.round(moneySaved / 100) // Show monthly estimate
    });
  };

  const resetDemo = () => {
    setActiveDemo(null);
    setGeneratedContent('');
    setProductName('');
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {demos.map((demo) => {
        // If demo has a custom component, render it directly
        if (demo.component) {
          const Component = demo.component;
          return <Component key={demo.id} />;
        }
        
        // Otherwise render the standard demo card
        return (
          <div
            key={demo.id}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
          <div className={`bg-gradient-to-r ${demo.color} p-6 text-white`}>
            <div className="text-4xl mb-3">{demo.icon}</div>
            <h3 className="text-xl font-bold mb-2">{demo.title}</h3>
            <p className="text-sm opacity-90">{demo.description}</p>
          </div>
          
          <div className="p-6">
            {activeDemo !== demo.id ? (
              <button
                onClick={() => setActiveDemo(demo.id)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Try Demo →
              </button>
            ) : (
              <div className="space-y-4">
                {/* Email Demo */}
                {demo.id === 'email' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select tone:
                      </label>
                      <select
                        value={emailTone}
                        onChange={(e) => setEmailTone(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="urgent">Urgent Response</option>
                      </select>
                    </div>
                    <button
                      onClick={handleEmailDemo}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Generate Email
                    </button>
                  </>
                )}

                {/* Product Demo */}
                {demo.id === 'product' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product name:
                      </label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., Wireless Headphones Pro"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category:
                      </label>
                      <select
                        value={productType}
                        onChange={(e) => setProductType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="home">Home & Garden</option>
                        <option value="beauty">Beauty & Health</option>
                        <option value="sports">Sports & Fitness</option>
                      </select>
                    </div>
                    <button
                      onClick={handleProductDemo}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Generate Description
                    </button>
                  </>
                )}

                {/* Time Calculator Demo */}
                {demo.id === 'time' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hours on repetitive tasks per week:
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="40"
                        value={hoursPerWeek}
                        onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-center text-2xl font-bold text-purple-600 mt-2">
                        {hoursPerWeek} hours
                      </div>
                    </div>
                    <button
                      onClick={calculateTimeSavings}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Calculate Savings
                    </button>
                  </>
                )}

                {/* Generated Content Display */}
                {generatedContent && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-500">GENERATED CONTENT</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedContent)}
                        className="text-xs text-purple-600 hover:text-purple-700"
                      >
                        Copy 📋
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {generatedContent}
                    </p>
                  </div>
                )}

                <button
                  onClick={resetDemo}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}