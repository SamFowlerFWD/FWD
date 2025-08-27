import React, { useState } from 'react';
import { trackMetric } from './ValueCounter';

const SAMPLE_INVOICE = `
INVOICE #2024-001
Date: March 15, 2024
Client: Tech Solutions Ltd
Address: 123 Business Park, London

Items:
- Web Development: £2,500
- AI Integration: £1,800
- Monthly Hosting: £99

Subtotal: £4,399
VAT (20%): £879.80
Total: £5,278.80

Payment Due: April 15, 2024
`;

interface ExtractedData {
  invoiceNumber: string;
  clientName: string;
  total: string;
  dueDate: string;
  items: string[];
}

export default function DataExtractorDemo() {
  const [showDemo, setShowDemo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const handleExtraction = () => {
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setExtractedData({
        invoiceNumber: '2024-001',
        clientName: 'Tech Solutions Ltd',
        total: '£5,278.80',
        dueDate: 'April 15, 2024',
        items: ['Web Development', 'AI Integration', 'Monthly Hosting']
      });
      setIsProcessing(false);
      
      // Track metrics
      trackMetric({
        demosCompleted: 1,
        tokensUsed: 0, // Mock demo, no actual API usage
        timeSaved: 15,
        potentialSavings: 300
      });
    }, 1500);
  };

  const reset = () => {
    setShowDemo(false);
    setExtractedData(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white">
        <div className="text-4xl mb-3">📄</div>
        <h3 className="text-xl font-bold mb-2">Invoice Data Extractor</h3>
        <p className="text-sm opacity-90">Extract key data from documents instantly</p>
      </div>

      <div className="p-6">
        {!showDemo ? (
          <button
            onClick={() => setShowDemo(true)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Try Demo →
          </button>
        ) : (
          <div className="space-y-4">
            {!extractedData ? (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Sample Invoice:</h4>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                    {SAMPLE_INVOICE}
                  </pre>
                </div>

                <button
                  onClick={handleExtraction}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⚙️</span>
                      Processing...
                    </span>
                  ) : (
                    'Extract Data with AI'
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-800 mb-3">
                    ✅ Data Extracted Successfully
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice #:</span>
                      <span className="font-medium text-gray-900">{extractedData.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client:</span>
                      <span className="font-medium text-gray-900">{extractedData.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-green-600">{extractedData.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium text-gray-900">{extractedData.dueDate}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-green-100">
                      <span className="text-gray-600 text-xs">Items Extracted:</span>
                      <ul className="mt-1">
                        {extractedData.items.map((item, idx) => (
                          <li key={idx} className="text-xs text-gray-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Time Saved:</strong> 15 minutes per invoice<br />
                    <strong>Accuracy:</strong> 99.9%<br />
                    <strong>Processing:</strong> Under 2 seconds
                  </p>
                </div>

                <button
                  onClick={reset}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  ← Try Again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}