import React, { useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Upload } from 'lucide-react';

const UploadQR = ({ onScanSuccess, onScanError }) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('temp-scanner');
      const qrCodeMessage = await html5QrCode.scanFile(file, true);
      onScanSuccess(qrCodeMessage);
    } catch (error) {
      onScanError('Failed to decode QR code from image');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <button
        onClick={triggerFileInput}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Upload size={24} />
        Upload QR Image
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <div id="temp-scanner" className="hidden"></div>
    </div>
  );
};

export default UploadQR;