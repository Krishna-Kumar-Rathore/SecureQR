import React, { useState } from 'react';
import QRScanner from './components/QRScanner';
import UploadQR from './components/UploadQR';
import ResultDisplay from './components/ResultDisplay';
import { checkURL } from './utils/api';
import { Shield, Scan, Smartphone } from 'lucide-react';

function App() {
  const [decodedText, setDecodedText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('scan');

  const handleScanSuccess = async (text) => {
    setDecodedText(text);
    setLoading(true);
    setResult(null);

    try {
      const response = await checkURL(text);
      setResult(response);
    } catch (error) {
      setResult({
        status: 'error',
        message: 'Failed to analyze QR code content'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScanError = (error) => {
    console.error('Scan error:', error);
  };

  const resetScan = () => {
    setDecodedText('');
    setResult(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="text-blue-600" size={40} />
            <h1 className="text-4xl font-bold text-gray-800">SecureQR</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Scan or upload QR codes to check for malicious content and protect yourself from phishing and malware attacks.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            
            {/* Tab Navigation */}
            <div className="flex mb-6 border-b">
              <button
                onClick={() => setActiveTab('scan')}
                className={`pb-2 px-4 font-medium ${
                  activeTab === 'scan'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Scan className="inline mr-2" size={16} />
                Live Scanner
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`pb-2 px-4 font-medium ${
                  activeTab === 'upload'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload Image
              </button>
            </div>

            {/* Scanner/Upload Section */}
            <div className="mb-6">
              {activeTab === 'scan' ? (
                <QRScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                />
              ) : (
                <UploadQR
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                />
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing QR code content...</p>
              </div>
            )}

            {/* Results */}
            <ResultDisplay result={result} decodedText={decodedText} />

            {/* Reset Button */}
            {(result || decodedText) && (
              <div className="mt-6 text-center">
                <button
                  onClick={resetScan}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Scan Another QR Code
                </button>
              </div>
            )}
          </div>

          {/* Security Features */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-500 mb-3">
                <Shield size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Google Safe Browsing</h3>
              <p className="text-gray-600 text-sm">
                Real-time protection against known malicious websites and phishing attempts.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-green-500 mb-3">
                <Scan size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Detection</h3>
              <p className="text-gray-600 text-sm">
                Advanced machine learning model trained on 200k QR codes for enhanced security.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-purple-500 mb-3">
                <Smartphone size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">UPI Validation</h3>
              <p className="text-gray-600 text-sm">
                Special validation for UPI payment QR codes to prevent payment fraud.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;