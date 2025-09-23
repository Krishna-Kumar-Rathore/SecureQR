const fs = require('fs');
const path = require('path');
const { extractFeatures } = require('../utils/features');

class MLModelService {
  constructor() {
    this.model = null;
    this.loadModel();
  }

  loadModel() {
    try {
      const modelPath = path.join(__dirname, '../models/trained_model.json');
      if (fs.existsSync(modelPath)) {
        const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
        this.model = modelData;
        console.log('✅ ML Model loaded successfully');
      } else {
        console.warn('⚠️ ML Model not found, using fallback rules');
        this.model = this.createFallbackModel();
      }
    } catch (error) {
      console.error('❌ Error loading ML model:', error);
      this.model = this.createFallbackModel();
    }
  }

  createFallbackModel() {
    // Simple rule-based fallback model
    return {
      type: 'fallback',
      rules: {
        suspiciousKeywords: ['phishing', 'malware', 'virus', 'hack', 'steal', 'password', 'account', 'verify', 'urgent', 'limited', 'offer'],
        suspiciousDomains: ['bit.ly', 'tinyurl.com', 'goo.gl'],
        maxUrlLength: 200,
        maxDots: 5,
        maxHyphens: 10
      }
    };
  }

  async predictURL(url) {
    try {
      const features = extractFeatures(url);
      
      if (this.model.type === 'fallback') {
        return this.fallbackPredict(url, features);
      }

      // For actual trained model prediction
      // This would use the actual XGBoost model loaded from file
      return this.fallbackPredict(url, features);
    } catch (error) {
      console.error('ML prediction error:', error);
      return {
        isMalicious: false,
        confidence: 0.5,
        reason: 'Prediction error'
      };
    }
  }

  fallbackPredict(url, features) {
    let suspiciousScore = 0;
    const reasons = [];

    // Check suspicious keywords
    const lowerUrl = url.toLowerCase();
    const suspiciousKeywords = this.model.rules.suspiciousKeywords;
    const foundKeywords = suspiciousKeywords.filter(keyword => lowerUrl.includes(keyword));
    if (foundKeywords.length > 0) {
      suspiciousScore += foundKeywords.length * 0.3;
      reasons.push(`Contains suspicious keywords: ${foundKeywords.join(', ')}`);
    }

    // Check URL length
    if (features.urlLength > this.model.rules.maxUrlLength) {
      suspiciousScore += 0.2;
      reasons.push('URL is unusually long');
    }

    // Check excessive dots
    if (features.dotCount > this.model.rules.maxDots) {
      suspiciousScore += 0.15;
      reasons.push('Excessive dots in URL');
    }

    // Check excessive hyphens
    if (features.hyphenCount > this.model.rules.maxHyphens) {
      suspiciousScore += 0.15;
      reasons.push('Excessive hyphens in URL');
    }

    // Check suspicious domains
    const domain = this.extractDomain(url);
    if (this.model.rules.suspiciousDomains.includes(domain)) {
      suspiciousScore += 0.4;
      reasons.push('Known URL shortener or suspicious domain');
    }

    // Check for IP addresses instead of domains
    if (this.isIPAddress(domain)) {
      suspiciousScore += 0.5;
      reasons.push('Uses IP address instead of domain name');
    }

    const confidence = Math.min(suspiciousScore, 1.0);
    const isMalicious = confidence > 0.6;

    return {
      isMalicious,
      confidence,
      reason: reasons.join('; ') || 'No suspicious patterns detected'
    };
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  isIPAddress(domain) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(domain);
  }
}

module.exports = new MLModelService();