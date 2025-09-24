const fs = require('fs');
const path = require('path');

class SmartAnalyzer {
  constructor() {
    this.suspiciousKeywords = [
      'phishing', 'malware', 'virus', 'hack', 'steal', 'password', 
      'account', 'verify', 'urgent', 'limited', 'offer', 'click',
      'winner', 'prize', 'free', 'gift', 'bonus', 'promotion',
      'suspend', 'locked', 'confirm', 'update', 'secure', 'bank',
      'paypal', 'amazon', 'microsoft', 'google', 'apple', 'netflix',
      'crypto', 'bitcoin', 'wallet', 'investment', 'trading'
    ];
    
    this.suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'short.link',
      'tiny.cc', 'lnkd.in', 'rebrand.ly', 'ow.ly', 'buff.ly',
      'is.gd', 'v.gd', 'x.co', 'po.st', 'bc.vc', 'cutt.ly'
    ];

    this.suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.pw', '.top'];
    
    // Load trained model if available
    this.trainedModel = this.loadTrainedModel();
  }

  loadTrainedModel() {
    try {
      const modelPath = path.join(__dirname, '../models/trained_model.json');
      if (fs.existsSync(modelPath)) {
        const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
        console.log('✅ Trained ML model loaded successfully');
        console.log(`📊 Model: ${modelData.model_type}, Features: ${modelData.feature_count}`);
        return modelData;
      } else {
        console.log('⚠️ No trained ML model found, using rule-based analysis');
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Could not load trained model:', error.message);
      console.log('📋 Falling back to rule-based URL analysis');
      return null;
    }
  }

  analyzeURL(url) {
    const features = this.extractFeatures(url);
    let riskScore = this.calculateRiskScore(features);
    
    // If trained model is available, use it for enhanced prediction
    if (this.trainedModel) {
      try {
        const mlScore = this.predictWithTrainedModel(features);
        // Combine rule-based and ML scores (weighted average)
        riskScore = (riskScore * 0.4) + (mlScore * 0.6);
      } catch (error) {
        console.warn('ML prediction failed, using rule-based analysis:', error.message);
      }
    }
    
    return {
      isSuspicious: riskScore > 0.5,
      severity: riskScore > 0.8 ? 'high' : riskScore > 0.5 ? 'medium' : 'low',
      confidence: Math.min(riskScore + 0.1, 1.0),
      reason: this.generateReason(features, riskScore),
      details: features,
      mlModelUsed: !!this.trainedModel,
      riskScore: riskScore
    };
  }

  predictWithTrainedModel(features) {
    if (!this.trainedModel || !this.trainedModel.top_features) {
      return 0;
    }

    // Simple scoring based on top features from trained model
    let score = 0;
    const topFeatures = this.trainedModel.top_features.slice(0, 15); // Use top 15 features
    
    for (const [featureName, importance] of topFeatures) {
      const featureValue = this.getFeatureValue(features, featureName);
      
      // Normalize importance (0-1) and calculate contribution
      const maxImportance = Math.max(...topFeatures.map(f => f[1]));
      const normalizedImportance = importance / maxImportance;
      
      // Simple heuristic scoring based on feature risk
      if (this.isHighRiskFeature(featureName, featureValue)) {
        score += normalizedImportance * 0.2;
      }
    }

    return Math.min(score, 1.0);
  }

  getFeatureValue(features, featureName) {
    // Map our feature names to ML model feature names
    const featureMapping = {
      'url_length': features.urlLength,
      'has_ip': features.hasIP ? 1 : 0,
      'is_shortener': features.isShortener ? 1 : 0,
      'suspicious_keyword_count': features.suspiciousKeywordCount,
      'subdomain_count': features.subdomainCount,
      'has_port': features.hasPort ? 1 : 0,
      'is_https': features.isHTTPS ? 1 : 0,
      'dot_count': features.dotCount || 0,
      'hyphen_count': features.hyphenCount || 0,
      'special_char_ratio': features.specialCharRatio || 0,
      'domain_length': features.domainLength || 0,
      'path_length': features.pathLength || 0,
      'query_length': features.queryLength || 0,
      'char_diversity': features.charDiversity || 0,
      'digit_ratio': features.digitRatio || 0
    };

    return featureMapping[featureName] || 0;
  }

  isHighRiskFeature(featureName, value) {
    // Define what constitutes high risk for each feature
    const riskThresholds = {
      'url_length': 100,
      'has_ip': 0.5,
      'is_shortener': 0.5,
      'suspicious_keyword_count': 1,
      'subdomain_count': 3,
      'has_port': 0.5,
      'is_https': -1, // HTTPS is good, so invert
      'dot_count': 5,
      'hyphen_count': 5,
      'special_char_ratio': 0.3,
      'domain_length': 50,
      'path_length': 100,
      'query_length': 50,
      'char_diversity': 0.8,
      'digit_ratio': 0.3
    };

    const threshold = riskThresholds[featureName] || 0;
    
    if (featureName === 'is_https') {
      return value < threshold; // HTTPS is good
    }
    
    return value > threshold;
  }

  extractFeatures(url) {
    const features = {
      urlLength: url.length,
      hasIP: this.hasIPAddress(url),
      isShortener: this.isURLShortener(url),
      suspiciousKeywordCount: this.countSuspiciousKeywords(url),
      specialCharCount: this.countSpecialChars(url),
      subdomainCount: this.countSubdomains(url),
      hasPort: this.hasPort(url),
      hasSuspiciousTLD: this.hasSuspiciousTLD(url),
      isHTTPS: url.startsWith('https://'),
      dotCount: (url.match(/\./g) || []).length,
      hyphenCount: (url.match(/-/g) || []).length,
      underscoreCount: (url.match(/_/g) || []).length,
      slashCount: (url.match(/\//g) || []).length,
      questionMarkCount: (url.match(/\?/g) || []).length,
      equalCount: (url.match(/=/g) || []).length,
      atCount: (url.match(/@/g) || []).length,
      ampersandCount: (url.match(/&/g) || []).length
    };

    // Extract domain-based features
    try {
      const urlObj = new URL(url);
      features.domainLength = urlObj.hostname.length;
      features.pathLength = urlObj.pathname.length;
      features.queryLength = urlObj.search.length;
      features.fragmentLength = urlObj.hash.length;
    } catch (error) {
      features.domainLength = 0;
      features.pathLength = 0;
      features.queryLength = 0;
      features.fragmentLength = 0;
    }

    // Calculate ratios and diversity
    features.specialCharRatio = features.specialCharCount / features.urlLength;
    features.digitRatio = this.calculateDigitRatio(url);
    features.charDiversity = this.calculateCharDiversity(url);

    return features;
  }

  calculateRiskScore(features) {
    let score = 0;

    // URL length penalty
    if (features.urlLength > 200) score += 0.3;
    else if (features.urlLength > 100) score += 0.15;
    else if (features.urlLength < 10) score += 0.2; // Very short URLs can be suspicious

    // IP address instead of domain (high risk)
    if (features.hasIP) score += 0.5;

    // URL shorteners (medium risk)
    if (features.isShortener) score += 0.4;

    // Suspicious keywords (scaled by count)
    score += Math.min(features.suspiciousKeywordCount * 0.25, 0.7);

    // Special character analysis
    if (features.specialCharRatio > 0.4) score += 0.3;
    else if (features.specialCharRatio > 0.2) score += 0.15;

    // Subdomain analysis
    if (features.subdomainCount > 4) score += 0.3;
    else if (features.subdomainCount > 2) score += 0.15;

    // Port analysis (non-standard ports are suspicious)
    if (features.hasPort) score += 0.2;

    // TLD analysis
    if (features.hasSuspiciousTLD) score += 0.4;

    // Protocol bonus/penalty
    if (features.isHTTPS) {
      score -= 0.1; // HTTPS is safer
    } else {
      score += 0.2; // HTTP is less secure
    }

    // Excessive special characters
    if (features.dotCount > 6) score += 0.2;
    if (features.hyphenCount > 6) score += 0.15;
    if (features.underscoreCount > 3) score += 0.1;

    // Character diversity (very high or very low can be suspicious)
    if (features.charDiversity > 0.9 || features.charDiversity < 0.3) {
      score += 0.1;
    }

    // Digit ratio analysis
    if (features.digitRatio > 0.4) score += 0.1;

    return Math.max(0, Math.min(score, 1.0));
  }

  generateReason(features, riskScore) {
    const reasons = [];

    if (features.hasIP) reasons.push('Uses IP address instead of domain name');
    if (features.isShortener) reasons.push('Known URL shortener service');
    if (features.suspiciousKeywordCount > 0) {
      reasons.push(`Contains ${features.suspiciousKeywordCount} suspicious keyword(s)`);
    }
    if (features.urlLength > 200) reasons.push('Unusually long URL');
    if (features.urlLength < 10) reasons.push('Suspiciously short URL');
    if (features.specialCharRatio > 0.4) reasons.push('High ratio of special characters');
    if (features.subdomainCount > 4) reasons.push('Too many subdomains');
    if (features.hasPort) reasons.push('Uses non-standard port');
    if (features.hasSuspiciousTLD) reasons.push('Suspicious top-level domain');
    if (!features.isHTTPS) reasons.push('Uses insecure HTTP protocol');
    if (features.dotCount > 6) reasons.push('Excessive dots in URL');
    if (features.hyphenCount > 6) reasons.push('Excessive hyphens in URL');

    // Add ML model reasoning if available
    if (this.trainedModel && riskScore > 0.5) {
      reasons.push('ML model detected suspicious patterns');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'No suspicious patterns detected';
  }

  // Helper methods for feature extraction
  hasIPAddress(url) {
    try {
      const urlObj = new URL(url);
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      return ipRegex.test(urlObj.hostname);
    } catch {
      return false;
    }
  }

  isURLShortener(url) {
    const lowerUrl = url.toLowerCase();
    return this.suspiciousDomains.some(domain => lowerUrl.includes(domain));
  }

  countSuspiciousKeywords(url) {
    const lowerUrl = url.toLowerCase();
    return this.suspiciousKeywords.filter(keyword => lowerUrl.includes(keyword)).length;
  }

  countSpecialChars(url) {
    return (url.match(/[-._~:/?#[\]@!$&'()*+,;=%]/g) || []).length;
  }

  countSubdomains(url) {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.hostname.split('.');
      return Math.max(0, parts.length - 2);
    } catch {
      return 0;
    }
  }

  hasPort(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.port !== '';
    } catch {
      return false;
    }
  }

  hasSuspiciousTLD(url) {
    const lowerUrl = url.toLowerCase();
    return this.suspiciousTLDs.some(tld => lowerUrl.includes(tld));
  }

  calculateDigitRatio(url) {
    const digitCount = (url.match(/\d/g) || []).length;
    return url.length > 0 ? digitCount / url.length : 0;
  }

  calculateCharDiversity(url) {
    const uniqueChars = new Set(url.toLowerCase()).size;
    return url.length > 0 ? uniqueChars / url.length : 0;
  }
}

module.exports = new SmartAnalyzer();