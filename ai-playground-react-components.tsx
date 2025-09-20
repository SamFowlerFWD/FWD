// AI Playground React Components with TypeScript
// Production-ready components for FWD website integration

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';

// ============================================
// Types and Interfaces
// ============================================

interface Demo {
  id: string;
  title: string;
  description: string;
  category: string;
  industries: string[];
  estimatedSavings: {
    time: number; // in minutes
    cost: number; // in dollars
  };
}

interface DemoResult {
  success: boolean;
  output: any;
  processingTime: number;
  confidence?: number;
}

interface UserMetrics {
  demosCompleted: number;
  totalTimeSaved: number;
  totalCostSaved: number;
  engagementScore: number;
}

// ============================================
// API Service Layer
// ============================================

class AIPlaygroundAPI {
  private static instance: AIPlaygroundAPI;
  private apiKeys: Map<string, string> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): AIPlaygroundAPI {
    if (!AIPlaygroundAPI.instance) {
      AIPlaygroundAPI.instance = new AIPlaygroundAPI();
    }
    return AIPlaygroundAPI.instance;
  }

  private initializeServices() {
    // Initialize rate limiters for each service
    this.rateLimiters.set('openai', new RateLimiter(10, 60000));
    this.rateLimiters.set('huggingface', new RateLimiter(100, 3600000));
    this.rateLimiters.set('elevenlabs', new RateLimiter(50, 60000));
    this.rateLimiters.set('mindee', new RateLimiter(20, 60000));
  }

  async generateText(prompt: string, service: string = 'huggingface'): Promise<string> {
    if (!this.rateLimiters.get(service)?.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, service }),
    });

    if (!response.ok) throw new Error('Generation failed');
    const data = await response.json();
    return data.text;
  }

  async processDocument(file: File, type: 'invoice' | 'receipt' | 'contract'): Promise<any> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);

    const response = await fetch('/api/ocr/process', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Document processing failed');
    return response.json();
  }

  async generateSpeech(text: string, voice: string = 'alloy'): Promise<Blob> {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) throw new Error('Speech generation failed');
    return response.blob();
  }

  async analyzeImage(image: File, task: string): Promise<any> {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('task', task);

    const response = await fetch('/api/vision/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Image analysis failed');
    return response.json();
  }
}

// ============================================
// Utility Classes
// ============================================

class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private timeWindow: number // in milliseconds
  ) {}

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }

  getTimeUntilNextRequest(): number {
    if (this.requests.length < this.maxRequests) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.timeWindow - (Date.now() - oldestRequest));
  }
}

// ============================================
// Custom Hooks
// ============================================

const useAIGeneration = () => {
  const api = AIPlaygroundAPI.getInstance();
  
  return useMutation({
    mutationFn: async ({ prompt, service }: { prompt: string; service?: string }) => {
      return api.generateText(prompt, service);
    },
    onError: (error) => {
      console.error('Generation error:', error);
    },
  });
};

const useDocumentProcessor = () => {
  const api = AIPlaygroundAPI.getInstance();
  
  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'invoice' | 'receipt' | 'contract' }) => {
      return api.processDocument(file, type);
    },
  });
};

const useUserMetrics = () => {
  const [metrics, setMetrics] = useState<UserMetrics>({
    demosCompleted: 0,
    totalTimeSaved: 0,
    totalCostSaved: 0,
    engagementScore: 0,
  });

  const updateMetrics = useCallback((demo: Demo) => {
    setMetrics(prev => ({
      demosCompleted: prev.demosCompleted + 1,
      totalTimeSaved: prev.totalTimeSaved + demo.estimatedSavings.time,
      totalCostSaved: prev.totalCostSaved + demo.estimatedSavings.cost,
      engagementScore: Math.min(100, prev.engagementScore + 10),
    }));
  }, []);

  return { metrics, updateMetrics };
};

// ============================================
// Main Components
// ============================================

export const AIPlayground: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [completedDemos, setCompletedDemos] = useState<Set<string>>(new Set());
  const { metrics, updateMetrics } = useUserMetrics();

  const industries = [
    { id: 'retail', name: 'Retail & E-commerce', icon: '🛍️' },
    { id: 'services', name: 'Professional Services', icon: '💼' },
    { id: 'manufacturing', name: 'Manufacturing', icon: '🏭' },
    { id: 'hospitality', name: 'Hospitality', icon: '🍽️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <PlaygroundHeader metrics={metrics} />

      {/* Industry Selector */}
      {!selectedIndustry ? (
        <IndustrySelector
          industries={industries}
          onSelect={setSelectedIndustry}
        />
      ) : (
        <DemoGrid
          industry={selectedIndustry}
          completedDemos={completedDemos}
          onDemoComplete={(demo) => {
            setCompletedDemos(prev => new Set(prev).add(demo.id));
            updateMetrics(demo);
          }}
        />
      )}

      {/* Value Calculator */}
      <ValueCalculator metrics={metrics} />

      {/* CTA Section */}
      <CTASection metrics={metrics} />
    </div>
  );
};

// ============================================
// Sub-Components
// ============================================

const PlaygroundHeader: React.FC<{ metrics: UserMetrics }> = ({ metrics }) => {
  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Playground
            </h1>
            <p className="text-sm text-gray-600">Experience the future of business automation</p>
          </div>
          
          <div className="flex gap-6">
            <MetricBadge label="Demos" value={metrics.demosCompleted} />
            <MetricBadge label="Time Saved" value={`${Math.floor(metrics.totalTimeSaved / 60)}h`} />
            <MetricBadge label="Value" value={`$${metrics.totalCostSaved}`} />
          </div>
        </div>
      </div>
    </header>
  );
};

const MetricBadge: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="text-center">
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

const IndustrySelector: React.FC<{
  industries: Array<{ id: string; name: string; icon: string }>;
  onSelect: (id: string) => void;
}> = ({ industries, onSelect }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl font-bold mb-4">Choose Your Industry</h2>
        <p className="text-xl text-gray-600">
          Select your industry to see AI solutions tailored to your business
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {industries.map((industry, index) => (
          <motion.button
            key={industry.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(industry.id)}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all"
          >
            <div className="text-6xl mb-4">{industry.icon}</div>
            <div className="font-semibold text-gray-900">{industry.name}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const DemoGrid: React.FC<{
  industry: string;
  completedDemos: Set<string>;
  onDemoComplete: (demo: Demo) => void;
}> = ({ industry, completedDemos, onDemoComplete }) => {
  // Demo data would typically come from an API
  const demos: Demo[] = [
    {
      id: 'product-description',
      title: 'Product Description AI',
      description: 'Generate compelling product descriptions',
      category: 'content',
      industries: ['retail'],
      estimatedSavings: { time: 15, cost: 25 },
    },
    {
      id: 'email-responder',
      title: 'Smart Email Responder',
      description: 'AI-powered email responses',
      category: 'communication',
      industries: ['retail', 'services', 'manufacturing', 'hospitality'],
      estimatedSavings: { time: 10, cost: 15 },
    },
    // Add more demos...
  ];

  const relevantDemos = demos.filter(demo => demo.industries.includes(industry));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relevantDemos.map((demo) => (
          <DemoCard
            key={demo.id}
            demo={demo}
            isCompleted={completedDemos.has(demo.id)}
            onComplete={() => onDemoComplete(demo)}
          />
        ))}
      </div>
    </div>
  );
};

const DemoCard: React.FC<{
  demo: Demo;
  isCompleted: boolean;
  onComplete: () => void;
}> = ({ demo, isCompleted, onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer ${
          isCompleted ? 'ring-2 ring-green-500' : ''
        }`}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">{demo.title}</h3>
          {isCompleted && (
            <span className="text-green-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-4">{demo.description}</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">⏱️ {demo.estimatedSavings.time} min saved</span>
          <span className="text-gray-500">💰 ${demo.estimatedSavings.cost} value</span>
        </div>
      </motion.div>

      <DemoModal
        demo={demo}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={onComplete}
      />
    </>
  );
};

const DemoModal: React.FC<{
  demo: Demo;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}> = ({ demo, isOpen, onClose, onComplete }) => {
  const [result, setResult] = useState<DemoResult | null>(null);

  const handleDemoInteraction = async () => {
    // Demo-specific logic here
    const mockResult: DemoResult = {
      success: true,
      output: 'Demo completed successfully!',
      processingTime: 1.2,
      confidence: 0.95,
    };
    
    setResult(mockResult);
    onComplete();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{demo.title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Demo-specific content would go here */}
              <div className="space-y-4">
                <p className="text-gray-600">{demo.description}</p>
                
                {/* Demo interaction area */}
                <div className="bg-gray-50 rounded-lg p-4">
                  {/* Add demo-specific inputs/controls here */}
                  <button
                    onClick={handleDemoInteraction}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    Try Demo
                  </button>
                </div>

                {/* Results display */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-800 font-semibold">Success!</span>
                      <span className="text-sm text-green-600">
                        Processed in {result.processingTime}s
                      </span>
                    </div>
                    <p className="text-gray-700">{result.output}</p>
                    {result.confidence && (
                      <div className="mt-2 text-sm text-green-600">
                        Confidence: {(result.confidence * 100).toFixed(1)}%
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ValueCalculator: React.FC<{ metrics: UserMetrics }> = ({ metrics }) => {
  const monthlyProjection = {
    time: metrics.totalTimeSaved * 20, // Assuming 20 working days
    cost: metrics.totalCostSaved * 20,
    efficiency: Math.min(45, metrics.engagementScore * 0.45),
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">
          Your Projected Monthly Savings
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <ValueMetric
            label="Time Saved"
            value={`${Math.floor(monthlyProjection.time / 60)}h`}
            description="Hours returned to your business"
          />
          <ValueMetric
            label="Cost Reduction"
            value={`$${monthlyProjection.cost.toLocaleString()}`}
            description="Direct cost savings per month"
          />
          <ValueMetric
            label="Efficiency Gain"
            value={`${monthlyProjection.efficiency.toFixed(0)}%`}
            description="Overall productivity improvement"
          />
        </div>

        <div className="text-center mt-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition"
          >
            Calculate My Custom ROI →
          </motion.button>
        </div>
      </div>
    </section>
  );
};

const ValueMetric: React.FC<{
  label: string;
  value: string;
  description: string;
}> = ({ label, value, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="text-center"
  >
    <div className="text-5xl font-bold mb-2">{value}</div>
    <div className="text-xl mb-1">{label}</div>
    <div className="text-blue-100 text-sm">{description}</div>
  </motion.div>
);

const CTASection: React.FC<{ metrics: UserMetrics }> = ({ metrics }) => {
  const ctaMessage = metrics.demosCompleted === 0
    ? "Start Your AI Journey Today"
    : metrics.demosCompleted < 3
    ? "You're Just Getting Started!"
    : "Ready to Transform Your Business?";

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6">{ctaMessage}</h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of businesses already using AI to save time and increase revenue
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
          >
            Get Started Free
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gray-100 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-200 transition"
          >
            Schedule a Demo
          </motion.button>
        </div>

        <div className="mt-12 flex justify-center gap-8">
          <TrustBadge icon="🔒" text="SOC 2 Compliant" />
          <TrustBadge icon="⚡" text="99.9% Uptime" />
          <TrustBadge icon="🌟" text="5-Star Support" />
        </div>
      </div>
    </section>
  );
};

const TrustBadge: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-2 text-gray-600">
    <span className="text-2xl">{icon}</span>
    <span className="text-sm font-medium">{text}</span>
  </div>
);

// ============================================
// Specialized Demo Components
// ============================================

export const ProductDescriptionDemo: React.FC = () => {
  const [productInfo, setProductInfo] = useState({
    name: '',
    features: '',
    tone: 'professional',
  });
  const [result, setResult] = useState('');
  const generateMutation = useAIGeneration();

  const handleGenerate = async () => {
    const prompt = `Create a ${productInfo.tone} product description for ${productInfo.name} with features: ${productInfo.features}`;
    const description = await generateMutation.mutateAsync({ prompt });
    setResult(description);
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Product name"
        value={productInfo.name}
        onChange={(e) => setProductInfo(prev => ({ ...prev, name: e.target.value }))}
        className="w-full px-4 py-2 border rounded-lg"
      />
      <textarea
        placeholder="Key features"
        value={productInfo.features}
        onChange={(e) => setProductInfo(prev => ({ ...prev, features: e.target.value }))}
        className="w-full px-4 py-2 border rounded-lg"
        rows={3}
      />
      <select
        value={productInfo.tone}
        onChange={(e) => setProductInfo(prev => ({ ...prev, tone: e.target.value }))}
        className="w-full px-4 py-2 border rounded-lg"
      >
        <option value="professional">Professional</option>
        <option value="casual">Casual</option>
        <option value="luxury">Luxury</option>
      </select>
      
      <button
        onClick={handleGenerate}
        disabled={generateMutation.isPending}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {generateMutation.isPending ? 'Generating...' : 'Generate Description'}
      </button>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-gray-800">{result}</p>
        </div>
      )}
    </div>
  );
};

export const InvoiceOCRDemo: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const processMutation = useDocumentProcessor();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    const data = await processMutation.mutateAsync({ file, type: 'invoice' });
    setResult(data);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="invoice-upload"
        />
        <label htmlFor="invoice-upload" className="cursor-pointer">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {file ? file.name : 'Click to upload invoice'}
            </p>
          </div>
        </label>
      </div>

      <button
        onClick={handleProcess}
        disabled={!file || processMutation.isPending}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {processMutation.isPending ? 'Processing...' : 'Extract Data'}
      </button>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Extracted Data:</h4>
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt className="text-gray-600">Invoice #:</dt>
              <dd className="font-medium">{result.invoiceNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Total:</dt>
              <dd className="font-medium text-green-600">${result.total}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Due Date:</dt>
              <dd className="font-medium">{result.dueDate}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};

// Export all components
export default {
  AIPlayground,
  ProductDescriptionDemo,
  InvoiceOCRDemo,
  PlaygroundHeader,
  IndustrySelector,
  DemoGrid,
  ValueCalculator,
  CTASection,
};