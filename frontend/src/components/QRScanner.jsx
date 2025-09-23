import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          onScanSuccess(decodedText);
          scanner.clear();
          setIsScanning(false);
        },
        (error) => {
          onScanError(error);
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isScanning, onScanSuccess, onScanError]);

  const startScanning = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setIsScanning(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!isScanning ? (
        <button
          onClick={startScanning}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Camera size={24} />
          Start QR Scanner
        </button>
      ) : (
        <div className="relative">
          <div id="qr-reader" className="w-full"></div>
          <button
            onClick={stopScanning}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;