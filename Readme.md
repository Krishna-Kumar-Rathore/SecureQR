# SecureQR - QR Code Security Scanner

A comprehensive web-based security tool that scans QR codes and analyzes their content for malicious URLs, phishing attempts, and other security threats using Google Safe Browsing API and machine learning.

## 🛡️ Features 

- **Real-time QR Code Scanning**: Live camera-based QR code detection
- **Image Upload Support**: Analyze QR codes from uploaded images
- **Multi-layer Security Analysis**:
  - Google Safe Browsing API integration
  - Custom ML model trained on 200K QR code dataset
  - Smart URL pattern analysis
  - Protocol security validation (HTTP vs HTTPS)
- **UPI Payment QR Validation**: Special handling for Indian UPI payment QR codes
- **Responsive Web Interface**: Mobile-friendly React frontend
- **Real-time Results**: Instant security analysis with confidence scores

## 🚀 Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **html5-qrcode** for QR scanning
- **Lucide React** for icons
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **Google Safe Browsing API v4**
- **Smart URL Analysis Engine**
- **CORS** enabled for cross-origin requests

### Machine Learning
- **Python 3.8+**
- **OpenCV** for QR code image processing
- **Scikit-learn** for ML models
- **XGBoost/LightGBM** for gradient boosting
- **Pandas/NumPy** for data processing

## 📁 Project Structure

```
SecureQR/
├── frontend/                    # React frontend application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── QRScanner.jsx    # Live QR scanner component
│   │   │   ├── UploadQR.jsx     # QR image upload component
│   │   │   └── ResultDisplay.jsx # Security analysis results
│   │   ├── utils/
│   │   │   └── api.js           # API communication
│   │   ├── App.jsx              # Main application component
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   └── index.html               # HTML template
│
├── backend/                     # Node.js backend API
│   ├── src/
│   │   ├── controllers/
│   │   │   └── urlController.js # URL analysis endpoint
│   │   ├── services/
│   │   │   ├── safeBrowsing.js  # Google Safe Browsing integration
│   │   │   ├── smartAnalyzer.js # ML-enhanced URL analysis
│   │   │   └── urlAnalyzer.js   # Basic URL utilities
│   │   ├── utils/
│   │   │   └── upiValidator.js  # UPI QR code validation
│   │   ├── models/              # Trained ML models (created during training)
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # Server entry point
│   ├── .env                     # Environment variables (not in git)
│   └── package.json             # Backend dependencies
│
├── ml-training/                 # Machine learning pipeline
│   ├── process_qr_dataset_windows.py  # QR image processing & URL extraction
│   ├── feature_extractor.py           # URL feature engineering
│   ├── train_model.py                 # ML model training
│   ├── requirements.txt               # Python dependencies
│   ├── processed_qr_dataset_with_urls.csv  # Processed dataset (generated)
│   ├── processed_qr_urls_only.csv          # Clean URLs for training (generated)
│   ├── training_report.json               # Model performance metrics (generated)
│   └── processing_report.json             # Dataset processing stats (generated)
│
├── dataset/                     # QR code training data (not in git)
│   └── QR Codes/
│       ├── GenuineOrValid/      # 100K legitimate QR code images
│       └── malicious/           # 100K malicious QR code images
│
├── docs/                        # Documentation
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
└── package.json                 # Root package.json for scripts
```

## 🔧 Setup Instructions

### Prerequisites
- **Node.js** 18+ (for frontend/backend)
- **Python** 3.8+ (for ML training)
- **Git** for version control
- **Google Cloud Console** account (for Safe Browsing API)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/SecureQR.git
cd SecureQR
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your Google Safe Browsing API key to .env
GOOGLE_SAFE_BROWSING_API_KEY=your_actual_api_key_here
PORT=5000
NODE_ENV=development
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. ML Training Setup (Optional)
```bash
cd ml-training

# Install Python dependencies
pip install -r requirements.txt

# Process QR dataset (if you have the dataset)
python process_qr_dataset_windows.py

# Train ML models
python train_model.py
```

### 5. Google Safe Browsing API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Safe Browsing API**
4. Create credentials (API Key)
5. Add the API key to `backend/.env`

## 🚀 Running the Application

### Development Mode
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Access application at http://localhost:5173
# Backend API at http://localhost:5000
```

### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd backend
npm start
```

## 📖 API Documentation

### POST /api/check-url
Analyzes a URL or text content for security threats.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "status": "safe|suspicious|malicious",
  "contentType": "url|upi|text",
  "threatType": "string or null",
  "checks": {
    "httpsProtocol": true,
    "safeBrowsing": true,
    "smartAnalyzer": true,
    "upiFormat": true
  },
  "confidence": 0.95,
  "source": "google_safe_browsing|smart_analyzer",
  "analysis": {
    "reason": "Detailed analysis explanation"
  }
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "SecureQR Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🤖 Machine Learning Pipeline

### Dataset Processing
The ML pipeline processes QR code images to extract URLs and train security models:

1. **QR Code Decoding**: Uses OpenCV to decode QR images
2. **URL Extraction**: Regex-based URL extraction from decoded text
3. **Feature Engineering**: Extracts 30+ URL features (length, special chars, domain analysis)
4. **Model Training**: Trains multiple models (Random Forest, XGBoost, LightGBM)
5. **Model Selection**: Chooses best performing model based on accuracy and AUC

### Features Analyzed
- URL length and structure
- Protocol security (HTTP vs HTTPS)
- Domain characteristics
- Suspicious keywords
- URL shortener detection
- IP address usage
- Special character patterns
- Subdomain analysis

## 🛡️ Security Features

### Multi-Layer Protection
1. **Google Safe Browsing**: Real-time threat database lookup
2. **ML Model Analysis**: Custom trained model on 200K QR codes
3. **Protocol Validation**: HTTP vs HTTPS security check
4. **Pattern Analysis**: Suspicious URL pattern detection
5. **UPI Validation**: Indian payment QR code security checks

### Threat Detection
- Phishing websites
- Malware distribution
- URL shortener abuse
- Suspicious domain patterns
- Insecure protocol usage
- Invalid UPI payment requests

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Google Safe Browsing API
GOOGLE_SAFE_BROWSING_API_KEY=your_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: API Rate Limiting
API_RATE_LIMIT=100
```

### Frontend Configuration
Modify `frontend/src/utils/api.js` to change API endpoint:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

## 📊 Performance Metrics

### ML Model Performance
- **Accuracy**: 95%+ on test dataset
- **AUC Score**: 98%+ for malicious URL detection
- **False Positive Rate**: <2%
- **Processing Time**: <500ms per URL

### System Performance
- **QR Scan Speed**: Real-time (30 FPS)
- **API Response Time**: <200ms average
- **Supported Formats**: PNG, JPG, JPEG, BMP, TIFF

## 🚀 Deployment

### Docker Deployment (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individually
docker build -t secureqr-frontend ./frontend
docker build -t secureqr-backend ./backend
```

### Traditional Deployment
1. Build frontend: `cd frontend && npm run build`
2. Deploy backend to cloud service (AWS, Heroku, etc.)
3. Configure environment variables
4. Set up reverse proxy (Nginx)

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test

# Test specific endpoint
curl -X POST http://localhost:5000/api/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'
```

### Frontend Testing
```bash
cd frontend
npm run test

# E2E testing
npm run test:e2e
```

## 📝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

### Development Guidelines
- Follow ESLint configuration for JavaScript
- Use PEP 8 for Python code
- Add tests for new features
- Update documentation
- Ensure cross-platform compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Node.js version (18+)
- Verify environment variables
- Ensure port 5000 is available

**Frontend build fails:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check React version compatibility
- Verify Tailwind CSS configuration

**QR scanning not working:**
- Enable camera permissions
- Use HTTPS for live scanning
- Check browser compatibility

**ML training fails:**
- Install Python dependencies: `pip install -r requirements.txt`
- Verify dataset structure
- Check available memory (>8GB recommended)

### Support
- Create GitHub Issues for bugs
- Check existing issues before reporting
- Provide detailed error logs
- Include system information



**Built by Krishna Kumar Rathore for cybersecurity and QR code safety**