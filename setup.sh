#!/bin/bash

echo "🚀 Setting up SecureQR Project..."

# Create main project structure
mkdir -p backend/src/{controllers,services,utils,models}
mkdir -p frontend/src/{components,utils}
mkdir -p ml-training
mkdir -p dataset

# Setup backend
echo "📦 Setting up backend..."
cd backend
npm init -y
npm install express cors dotenv axios multer sharp
npm install --save-dev nodemon

# Setup frontend
echo "🎨 Setting up frontend..."
cd ../frontend
npm create vite@latest . -- --template react --force
npm install
npm install tailwindcss postcss autoprefixer html5-qrcode axios lucide-react
npx tailwindcss init -p

# Setup ML training environment
echo "🤖 Setting up ML environment..."
cd ../ml-training
python -m pip install --upgrade pip
pip install opencv-python qrcode[pil] pandas numpy scikit-learn xgboost lightgbm pillow pyzbar tqdm

echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Add your Google Safe Browsing API key to backend/.env"
echo "2. Place your QR Codes dataset in dataset/QR Codes/"
echo "3. Run the ML training: cd ml-training && python process_qr_dataset.py && python train_model.py"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"