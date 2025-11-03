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
        return '⚠️ Proceed with caution - Potential security risk detected';
      case 'malicious':
        return '🚨 DO NOT PROCEED - Malicious content detected!';
      default:
        return 'Unknown status';
    }
  };

  // Helper function to get check status display
  const getCheckDisplay = (checkName, status) => {
    // Special handling for different checks
    const checkLabels = {
      'httpsProtocol': 'HTTPS Protocol',
      'safeBrowsing': 'Google Safe Browsing',
      'smartAnalyzer': 'ML Threat Detection',
      'upiFormat': 'UPI Format'
    };

    const label = checkLabels[checkName] || checkName;

    // For ML analyzer, inverse the logic display
    // smartAnalyzer: true = no threats found = PASS
    // smartAnalyzer: false = threats found = FAIL
    let displayStatus = status;
    let displayText = '';

    if (checkName === 'smartAnalyzer') {
      if (status === true) {
        displayText = 'No threats detected';
      } else if (status === false) {
        displayText = 'Threats detected';
      } else {
        displayText = 'Not available';
      }
    } else if (checkName === 'httpsProtocol') {
      displayText = status ? 'Secure HTTPS' : 'Insecure HTTP';
    } else if (checkName === 'safeBrowsing') {
      displayText = status ? 'Clean' : 'Flagged';
    } else {
      displayText = status ? 'Valid' : 'Invalid';
    }

    return { label, displayStatus, displayText };
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
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Decoded Content:
          </label>
          <div className="p-3 text-sm break-all bg-white border rounded">
            {decodedText}
          </div>
        </div>

        {result.contentType && (
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Content Type:
            </label>
            <div className="flex items-center gap-2">
              {result.contentType === 'upi' && <Smartphone size={16} />}
              <span className="text-sm font-semibold uppercase">{result.contentType}</span>
            </div>
          </div>
        )}

        {result.threatType && (
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Threat Details:
            </label>
            <p className="text-sm font-medium text-red-600">{result.threatType}</p>
          </div>
        )}

        {result.checks && Object.keys(result.checks).length > 0 && (
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Security Checks:
            </label>
            <div className="p-3 space-y-2 bg-white border rounded">
              {Object.entries(result.checks).map(([check, status]) => {
                const { label, displayStatus, displayText } = getCheckDisplay(check, status);
                
                let statusColor = 'text-gray-500';
                let statusIcon = '○';
                
                if (status === true) {
                  statusColor = 'text-green-600';
                  statusIcon = '✓';
                } else if (status === false) {
                  statusColor = 'text-red-600';
                  statusIcon = '✗';
                } else {
                  statusColor = 'text-gray-400';
                  statusIcon = '—';
                }

                return (
                  <div key={check} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{displayText}</span>
                      <span className={`font-bold text-lg ${statusColor}`}>
                        {statusIcon}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {result.confidence !== undefined && (
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Confidence Score:
            </label>
            <div className="space-y-2">
              <div className="w-full h-3 bg-gray-200 rounded-full">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    result.confidence > 0.7 ? 'bg-red-500' : 
                    result.confidence > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${result.confidence * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Safe</span>
                <span className="font-semibold">
                  {Math.round(result.confidence * 100)}% Risk Level
                </span>
                <span>Dangerous</span>
              </div>
            </div>
          </div>
        )}

        {result.analysis && result.analysis.reason && (
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Analysis Details:
            </label>
            <div className="p-3 text-xs text-gray-700 border rounded bg-gray-50">
              {result.analysis.reason}
            </div>
          </div>
        )}

        {result.source && (
          <div className="text-xs text-right text-gray-500">
            Analysis source: {result.source}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;