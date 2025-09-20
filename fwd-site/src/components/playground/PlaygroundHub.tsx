import React, { useState } from 'react';
import { 
  Sparkles, FileText, TrendingUp, MessageSquare, 
  BarChart3, Zap, Clock, Users, ArrowRight,
  CheckCircle, Star
} from 'lucide-react';
import DocumentProcessor from './DocumentProcessor';
import SocialMediaCenter from './SocialMediaCenter';
import AnalyticsDashboard from './AnalyticsDashboard';
import QuickDemos from './QuickDemos';
import AIAssistant from './AIAssistant';

type TabId = 'assistant' | 'document' | 'social' | 'analytics' | 'quick';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

const tabs: Tab[] = [
  {
    id: 'assistant',
    label: 'AI Business Solver',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Get personalized AI recommendations',
    badge: 'Most Popular'
  },
  {
    id: 'document',
    label: 'Document Processor',
    icon: <FileText className="w-5 h-5" />,
    description: 'Extract data from invoices & receipts',
    badge: 'New'
  },
  {
    id: 'social',
    label: 'Social Media Hub',
    icon: <MessageSquare className="w-5 h-5" />,
    description: 'Generate content for all platforms',
    badge: 'Hot'
  },
  {
    id: 'analytics',
    label: 'Live Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'See real-time business insights'
  },
  {
    id: 'quick',
    label: 'Quick Demos',
    icon: <Zap className="w-5 h-5" />,
    description: 'Try instant AI tools'
  }
];

const stats = [
  { label: 'Automations Running', value: '2,847', icon: <Zap className="w-4 h-4" /> },
  { label: 'Time Saved Today', value: '186 hrs', icon: <Clock className="w-4 h-4" /> },
  { label: 'Active Users', value: '1,293', icon: <Users className="w-4 h-4" /> },
  { label: 'Money Saved', value: '£47k', icon: <TrendingUp className="w-4 h-4" /> }
];

export default function PlaygroundHub() {
  const [activeTab, setActiveTab] = useState<TabId>('assistant');
  const [animatedStats, setAnimatedStats] = useState(false);

  // Animate stats on mount
  React.useEffect(() => {
    setTimeout(() => setAnimatedStats(true), 500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/20 to-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-12 px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Live Stats Bar */}
          <div className="mb-8 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">Live AI Playground</span>
              </div>
              <div className="hidden md:flex items-center gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="text-gray-400">{stat.icon}</div>
                    <div className="text-sm">
                      <span className="font-bold text-gray-900">{stat.value}</span>
                      <span className="text-gray-500 ml-1">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4" />
              <span className="text-sm font-semibold">Experience the Power of AI Automation</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-deep-space mb-6">
              AI Automation Playground
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Try our most powerful AI tools instantly. No signup, no credit card. 
              See exactly how automation transforms your business in real-time.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>100% Free to Try</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No Login Required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Real AI, Real Results</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Playground Section */}
      <section className="pb-20 px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative p-4 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {tab.badge && (
                      <span className={`absolute -top-1 -right-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                        tab.badge === 'New' ? 'bg-green-500 text-white' :
                        tab.badge === 'Hot' ? 'bg-red-500 text-white' :
                        'bg-gold text-white'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                    <div className="flex flex-col items-center gap-2">
                      {tab.icon}
                      <span className="font-medium text-sm">{tab.label}</span>
                      <span className={`text-xs ${
                        activeTab === tab.id ? 'text-white/80' : 'text-gray-500'
                      } hidden md:block`}>
                        {tab.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="transition-all duration-300">
            {activeTab === 'assistant' && (
              <div className="animate-fade-in">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                    <h2 className="text-2xl font-bold mb-2">AI Business Problem Solver</h2>
                    <p className="opacity-90">Answer a few questions to get your personalized AI transformation plan</p>
                  </div>
                  <AIAssistant />
                </div>
              </div>
            )}

            {activeTab === 'document' && (
              <div className="animate-fade-in">
                <DocumentProcessor />
              </div>
            )}

            {activeTab === 'social' && (
              <div className="animate-fade-in">
                <SocialMediaCenter />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="animate-fade-in">
                <AnalyticsDashboard />
              </div>
            )}

            {activeTab === 'quick' && (
              <div className="animate-fade-in">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-deep-space mb-4">Quick AI Demos</h2>
                  <p className="text-gray-600 mb-8">Try these instant demos to see AI in action</p>
                </div>
                <QuickDemos />
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Automate Your Business?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Stop losing to AI-powered competitors. Get your custom automation strategy today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/#contact" 
                className="inline-flex items-center gap-2 bg-white text-purple-900 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Your Free AI Strategy
                <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="/services" 
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 border border-white/30"
              >
                Explore All Services
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}