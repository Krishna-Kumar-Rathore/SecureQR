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
          className="flex items-center justify-center w-full gap-2 px-6 py-3 font-bold text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          <Camera size={24} />
          Start QR Scanner
        </button>
      ) : (
        <div className="relative">
          <div id="qr-reader" className="w-full"></div>
          <button
            onClick={stopScanning}
            className="absolute p-2 text-white bg-red-500 rounded-full top-2 right-2 hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};



export default QRScanner;