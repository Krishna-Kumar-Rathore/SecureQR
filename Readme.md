1. train ml model
cd ml-training 

# Process QR code images and extract text
python process_qr_dataset_windows.py

<!-- python process_qr_dataset.py -->


# Train the ML model
python train_model.py


2. start the Application
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend  
cd frontendv
npm run dev


# Project Structure
```
SecureQR/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── QRScanner.jsx
│   │   │   ├── ResultDisplay.jsx
│   │   │   └── UploadQR.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── urlController.js
│   │   ├── services/
│   │   │   ├── safeBrowsing.js
│   │   │   ├── mlModel.js
│   │   │   └── urlAnalyzer.js
│   │   ├── utils/
│   │   │   ├── features.js
│   │   │   └── upiValidator.js
│   │   ├── models/
│   │   │   └── trained_model.json
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env
├── ml-training/
│   ├── train_model.py
│   ├── feature_extractor.py
│   ├── process_qr_dataset.py
│   └── requirements.txt
├── dataset/
│   └── QR Codes/
│       ├── GenuineOrValid/
│       └── malicious/
├── package.json
├── README.md
└── setup.sh


```

# 1. Fix Backend
cd backend
rm -rf node_modules package-lock.json package.json

# Create the correct package.json (copy from above)
# Then:
npm install
npm run dev

# 2. Fix ML Training (in another terminal)
cd ../ml-training

# Replace process_qr_dataset_windows.py with corrected code
# Then:
python process_qr_dataset_windows.py

# 3. Start Frontend (in another terminal)
cd ../frontend

# Fix the Smartphone import issue:
# Add Smartphone to imports in App.jsx:
# import { Shield, Scan, Smartphone } from 'lucide-react';

npm run dev