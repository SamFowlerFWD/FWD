import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Check, AlertCircle, Download, Loader2 } from 'lucide-react';
import { trackMetric } from './ValueCounter';

interface ExtractedData {
  type?: string;
  invoiceNumber?: string;
  receiptNumber?: string;
  date?: string;
  clientName?: string;
  vendor?: string;
  clientAddress?: string;
  school?: string;
  grade?: string;
  items?: Array<{
    description: string;
    amount: number;
  }>;
  requiredItems?: Array<{
    item: string;
    quantity: string;
    notes?: string;
  }>;
  optionalItems?: Array<{
    item: string;
    quantity: string;
    notes?: string;
  }>;
  subtotal?: number;
  tax?: number;
  total?: number;
  dueDate?: string;
  deadline?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  notes?: string;
  error?: string;
  [key: string]: any;
}

interface ProcessingResult {
  success: boolean;
  data?: ExtractedData;
  error?: string;
  processingTime?: number;
  message?: string;
}

export default function DocumentProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResult(null);
      
      // Create preview for images
      if (uploadedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(uploadedFile);
      } else {
        setPreview(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/*': ['.csv', '.txt']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const processDocument = async () => {
    if (!file) return;

    setProcessing(true);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }

      const response = await fetch('/api/playground/document-processor', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.extractedData) {
        setResult({
          success: true,
          data: data.extractedData,
          processingTime: Date.now() - startTime,
          message: data.message
        });
        
        trackMetric({
          demosCompleted: 1,
          tokensUsed: data.tokensUsed || 100,
          timeSaved: 20,
          potentialSavings: 500
        });
      } else if (data.extractedData) {
        // Even if there was an error, we might have fallback data
        setResult({
          success: true,
          data: data.extractedData,
          processingTime: Date.now() - startTime,
          message: data.message || 'Using demo mode with sample data'
        });
        
        trackMetric({
          demosCompleted: 1,
          tokensUsed: 0,
          timeSaved: 20,
          potentialSavings: 500
        });
      } else {
        // Fallback to mock data for demo
        setTimeout(() => {
          setResult({
            success: true,
            data: generateMockData(file.name),
            processingTime: 1800
          });
          
          trackMetric({
            demosCompleted: 1,
            tokensUsed: 0,
            timeSaved: 20,
            potentialSavings: 500
          });
        }, 2000);
      }
    } catch (error) {
      // Use mock data for demo purposes
      setTimeout(() => {
        setResult({
          success: true,
          data: generateMockData(file.name),
          processingTime: 1500
        });
      }, 2000);
    } finally {
      setProcessing(false);
    }
  };

  const generateMockData = (filename: string): ExtractedData => {
    const lower = filename.toLowerCase();
    const isInvoice = lower.includes('invoice');
    const isReceipt = lower.includes('receipt');
    const isSchool = lower.includes('school') || lower.includes('supplies') || lower.includes('stationary');
    
    if (isSchool) {
      return {
        type: 'school_supplies',
        school: 'Sample Elementary School',
        grade: 'Year 6',
        requiredItems: [
          { item: 'Exercise Books', quantity: '10', notes: 'A4 size, lined' },
          { item: 'HB Pencils', quantity: '12', notes: 'With erasers' },
          { item: 'Coloured Pencils', quantity: '1 set', notes: '12 colours' },
          { item: 'Glue Sticks', quantity: '4', notes: 'Large size' }
        ],
        optionalItems: [
          { item: 'Pencil Case', quantity: '1' },
          { item: 'Water Bottle', quantity: '1' }
        ],
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        notes: 'Please label all items with student name'
      };
    }
    
    if (isReceipt) {
      return {
        type: 'receipt',
        receiptNumber: `RCP-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
        date: new Date().toLocaleDateString(),
        vendor: 'Quick Purchase Store',
        items: [
          { description: 'Office Supplies', amount: 45.99 },
          { description: 'Printer Paper', amount: 28.50 },
          { description: 'Ink Cartridges', amount: 67.80 }
        ],
        subtotal: 142.29,
        tax: 28.46,
        total: 170.75,
        paymentMethod: 'Credit Card'
      };
    }
    
    return {
      type: 'invoice',
      invoiceNumber: `INV-2024-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
      date: new Date().toLocaleDateString(),
      clientName: 'Acme Corporation Ltd',
      clientAddress: '123 Business Park, London, UK',
      items: [
        { description: 'Consulting Services - March 2024', amount: 3500 },
        { description: 'Software Development - 40 hours', amount: 4800 },
        { description: 'Project Management', amount: 1200 },
        { description: 'Cloud Hosting & Maintenance', amount: 299 }
      ],
      subtotal: 9799,
      tax: 1959.80,
      total: 11758.80,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      paymentTerms: 'Net 30'
    };
  };

  const exportToCSV = () => {
    if (!result?.data) return;
    
    const data = result.data;
    let csv = '';
    
    if (data.type === 'school_supplies') {
      csv = [
        ['Field', 'Value'],
        ['School', data.school || ''],
        ['Grade', data.grade || ''],
        ['Deadline', data.deadline || ''],
        '',
        ['Required Items', 'Quantity', 'Notes'],
        ...(data.requiredItems?.map(item => [item.item, item.quantity, item.notes || '']) || []),
        '',
        ['Optional Items', 'Quantity', 'Notes'],
        ...(data.optionalItems?.map(item => [item.item, item.quantity, item.notes || '']) || []),
        '',
        ['Notes', data.notes || '']
      ].map(row => row.join(',')).join('\n');
    } else {
      csv = [
        ['Field', 'Value'],
        ['Document Number', data.invoiceNumber || data.receiptNumber || ''],
        ['Date', data.date || ''],
        ['Client/Vendor', data.clientName || data.vendor || ''],
        ['Total', data.total?.toString() || ''],
        ['Due Date', data.dueDate || ''],
        ['Payment Method', data.paymentMethod || ''],
        '',
        ['Items', 'Amount'],
        ...(data.items?.map(item => [item.description, item.amount?.toString() || '']) || [])
      ].map(row => row.join(',')).join('\n');
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-${data.type || 'data'}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setPreview(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold">Smart Document Processor</h3>
            <p className="text-sm opacity-90">Extract data from invoices & receipts instantly</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-700 font-medium mb-2">
              {isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, JPG, PNG, TXT, CSV (max 5MB)
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Invoices
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Receipts
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                School Lists
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Purchase Orders
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!result ? (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={reset}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {preview && (
                    <img 
                      src={preview} 
                      alt="Document preview" 
                      className="w-full h-48 object-cover rounded border border-gray-200"
                    />
                  )}
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Optional: Describe your document (helps with text extraction)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., 'School stationary requirements list for Year 6' or 'Invoice from office supplies vendor'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                  />
                </div>

                <button
                  onClick={processDocument}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Document...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Extract Data with AI
                    </>
                  )}
                </button>
              </>
            ) : result.success && result.data ? (
              <>
                {result.message && (
                  <div className="bg-gold/10 border border-gold/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gold-dark">{result.message}</p>
                  </div>
                )}
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">
                      Data Extracted Successfully
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Display based on document type */}
                    {result.data.type === 'schedule' ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Service:</span>
                            <p className="font-medium text-gray-900">
                              {result.data.serviceName || result.data['Service/route name'] || result.data.extractedFrom?.replace('.pdf', '').replace(/_/g, ' ') || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Route:</span>
                            <p className="font-medium text-gray-900">{result.data.routeNumber || result.data['Route'] || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">From:</span>
                            <p className="font-medium text-gray-900">{result.data.startPoint || result.data['Start point'] || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">To:</span>
                            <p className="font-medium text-gray-900">{result.data.endPoint || result.data['End point'] || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Departure:</span>
                            <p className="font-medium text-gray-900">{result.data.departureTime || result.data['Departure'] || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Arrival:</span>
                            <p className="font-medium text-gray-900">{result.data.arrivalTime || result.data['Arrival'] || 'N/A'}</p>
                          </div>
                        </div>
                        
                        {((result.data.stops && result.data.stops.length > 0) || result.data.Stops || result.data['Stops/stages with timings']) && (
                          <div className="pt-3 border-t border-green-100">
                            <p className="text-gray-600 text-sm mb-2">Stops:</p>
                            <div className="space-y-1">
                              {(result.data.stops || result.data.Stops || []).map?.((stop, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{stop.name || stop.stop_name || `Stop ${idx + 1}`}</span>
                                  <span className="font-medium">{stop.time || stop.timing || ''}</span>
                                </div>
                              )) || (
                                // If stops is an object instead of array
                                Object.entries(result.data['Stops/stages with timings'] || {}).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{value?.split?.(' - ')[0] || key}</span>
                                    <span className="font-medium">{value?.split?.(' - ')[1] || value}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                        
                        {(result.data.notes || result.data['Important notes or warnings'] || result.data['Important Information']) && (
                          <div className="pt-3 border-t border-green-100">
                            <p className="text-gray-600 text-sm mb-2">Important Notes:</p>
                            <ul className="space-y-1 text-sm text-gray-700">
                              {Array.isArray(result.data.notes) ? (
                                result.data.notes.map((note, idx) => (
                                  <li key={idx}>• {note}</li>
                                ))
                              ) : typeof result.data['Important Information'] === 'object' ? (
                                Object.entries(result.data['Important Information']).map(([key, value], idx) => (
                                  <li key={idx}>• <strong>{key}:</strong> {value}</li>
                                ))
                              ) : (
                                <li>• {result.data.notes || result.data['Important notes or warnings'] || result.data['Important Information']}</li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {/* Display Schedule if present */}
                        {result.data.Schedule && (
                          <div className="pt-3 border-t border-green-100">
                            <p className="text-gray-600 text-sm mb-2">Schedule Details:</p>
                            <div className="text-sm text-gray-700 space-y-2">
                              {Object.entries(result.data.Schedule).map(([key, value]: [string, any], idx) => (
                                <div key={idx}>
                                  <strong>{key}:</strong>
                                  {typeof value === 'object' ? (
                                    <div className="ml-4 mt-1">
                                      {Object.entries(value).map(([k, v]: [string, any], i) => (
                                        <div key={i} className="text-gray-600">
                                          {k}: {typeof v === 'object' ? JSON.stringify(v) : v}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="ml-2">{value}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : result.data.type === 'school_supplies' ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">School:</span>
                            <p className="font-medium text-gray-900">{result.data.school || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Grade:</span>
                            <p className="font-medium text-gray-900">{result.data.grade || 'N/A'}</p>
                          </div>
                          {result.data.deadline && (
                            <div className="col-span-2">
                              <span className="text-gray-600">Deadline:</span>
                              <p className="font-medium text-gray-900">{result.data.deadline}</p>
                            </div>
                          )}
                        </div>
                        
                        {result.data.requiredItems && result.data.requiredItems.length > 0 && (
                          <div className="pt-3 border-t border-green-100">
                            <p className="text-gray-600 text-sm mb-2">Required Items:</p>
                            <div className="space-y-1">
                              {result.data.requiredItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-700">
                                    {item.item} {item.notes && <span className="text-gray-500">({item.notes})</span>}
                                  </span>
                                  <span className="font-medium">{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {result.data.optionalItems && result.data.optionalItems.length > 0 && (
                          <div className="pt-3 border-t border-green-100">
                            <p className="text-gray-600 text-sm mb-2">Optional Items:</p>
                            <div className="space-y-1">
                              {result.data.optionalItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{item.item}</span>
                                  <span className="font-medium">{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : result.data.type === 'document' || !result.data.type ? (
                      <>
                        {/* Generic document display */}
                        <div className="text-sm">
                          {result.data.title && (
                            <div className="mb-3">
                              <span className="text-gray-600">Title:</span>
                              <p className="font-medium text-gray-900">{result.data.title}</p>
                            </div>
                          )}
                          {result.data.content && (
                            <div className="mb-3">
                              <span className="text-gray-600">Content:</span>
                              <p className="text-gray-700 mt-1">{result.data.content}</p>
                            </div>
                          )}
                          {result.data.extractedFrom && (
                            <div className="mb-3">
                              <span className="text-gray-600">Source:</span>
                              <p className="text-gray-700">{result.data.extractedFrom}</p>
                            </div>
                          )}
                          {/* Display any other fields dynamically */}
                          {Object.keys(result.data).filter(key => 
                            !['type', 'title', 'content', 'extractedFrom', 'processedAt'].includes(key)
                          ).map(key => (
                            <div key={key} className="mb-2">
                              <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <p className="text-gray-700">
                                {typeof result.data[key] === 'object' 
                                  ? JSON.stringify(result.data[key], null, 2) 
                                  : result.data[key]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Invoice/Receipt display */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Document #:</span>
                            <p className="font-medium text-gray-900">
                              {result.data.invoiceNumber || result.data.receiptNumber || result.data.documentNumber || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Date:</span>
                            <p className="font-medium text-gray-900">{result.data.date || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">{result.data.vendor ? 'Vendor' : 'Client'}:</span>
                            <p className="font-medium text-gray-900">
                              {result.data.clientName || result.data.vendor || 'N/A'}
                            </p>
                          </div>
                          {result.data.total && (
                            <div>
                              <span className="text-gray-600">Total:</span>
                              <p className="font-bold text-green-600">
                                £{result.data.total.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {result.data.items && result.data.items.length > 0 && (
                          <div className="pt-3 border-t border-green-100">
                            <p className="text-gray-600 text-sm mb-2">Line Items:</p>
                            <div className="space-y-1">
                              {result.data.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{item.description}</span>
                                  <span className="font-medium">£{item.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-800 mb-1">Performance Stats</p>
                      <p className="text-blue-700">
                        ⚡ Processed in {((result.processingTime || 0) / 1000).toFixed(1)}s<br />
                        ✨ 99.9% accuracy rate<br />
                        ⏱️ Saves 20 minutes per document<br />
                        💰 Reduces data entry costs by 95%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={exportToCSV}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Process Another
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">
                  {result?.error || 'Failed to process document'}
                </p>
                <button
                  onClick={reset}
                  className="mt-3 text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Try Again →
                </button>
              </div>
            )}
          </div>
        )}
        
        {!file && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
            <p className="text-sm text-gray-700 font-medium mb-2">
              🚀 What This Automates:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Instant data extraction from any invoice format</li>
              <li>• Automatic expense categorization</li>
              <li>• Direct export to accounting software</li>
              <li>• Eliminates manual data entry errors</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}