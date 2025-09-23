import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Shield, Smartphone } from 'lucide-react';

const ResultDisplay = ({ result, decodedText }) => {
  if (!result) return null;

  const getStatusIcon = () => {
    switch (result.status) {
      case 'safe':
        return <CheckCircle className="text-green-500" size={32} />;
      case 'suspicious':
        return <AlertTriangle className="text-yellow-500" size={32} />;
      case 'malicious':
        return <XCircle className="text-red-500" size={32} />;
      default:
        return <Shield className="text-gray-500" size={32} />;
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'safe':
        return 'border-green-200 bg-green-50';
      case 'suspicious':
        return 'border-yellow-200 bg-yellow-50';
      case 'malicious':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusText = () => {
    switch (result.status) {
      case 'safe':
        return 'Safe to proceed';
      case 'suspicious':
        return 'Proceed with caution';
      case 'malicious':
        return 'Do not proceed - Malicious content detected';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className={`mt-6 p-6 border-2 rounded-lg ${getStatusColor()}`}>
      <div className="flex items-center gap-3 mb-4">
        {getStatusIcon()}
        <div>
          <h3 className="text-lg font-semibold">{getStatusText()}</h3>
          <p className="text-sm text-gray-600">Security Analysis Complete</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Decoded Content:
          </label>
          <div className="p-3 bg-white border rounded break-all text-sm">
            {decodedText}
          </div>
        </div>

        {result.contentType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content Type:
            </label>
            <div className="flex items-center gap-2">
              {result.contentType === 'upi' && <Smartphone size={16} />}
              <span className="text-sm">{result.contentType.toUpperCase()}</span>
            </div>
          </div>
        )}

        {result.threatType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Threat Details:
            </label>
            <p className="text-sm text-red-600">{result.threatType}</p>
          </div>
        )}

        {result.checks && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Security Checks:
            </label>
            <div className="space-y-1">
              {Object.entries(result.checks).map(([check, status]) => (
                <div key={check} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{check.replace(/([A-Z])/g, ' $1')}</span>
                  <span className={status ? 'text-green-600' : 'text-red-600'}>
                    {status ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.confidence && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confidence Score:
            </label>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  result.confidence > 0.8 ? 'bg-green-500' : 
                  result.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">
              {Math.round(result.confidence * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;