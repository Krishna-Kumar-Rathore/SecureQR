const fs = require('fs');
const path = require('path');

class SmartAnalyzer {
  constructor() {
    // Expanded suspicious keywords
    this.suspiciousKeywords = [
      'phishing', 'malware', 'virus', 'hack', 'steal', 'password', 
      'account', 'verify', 'urgent', 'limited', 'offer', 'click',
      'winner', 'prize', 'free', 'gift', 'bonus', 'promotion',
      'suspend', 'locked', 'confirm', 'update', 'secure', 'bank',
      'paypal', 'amazon', 'microsoft', 'google', 'apple', 'netflix',
      'crypto', 'bitcoin', 'wallet', 'investment', 'trading',
      'signin', 'login', 'security', 'checkpoint', 'verification',
      'customer', 'support', 'service', 'help-desk', 'validate',
      'restore', 'recover', 'unusual', 'activity', 'suspended',
      'action-required', 'immediately', 'expire', 'temporary'
    ];
    
    this.suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'short.link',
      'tiny.cc', 'lnkd.in', 'rebrand.ly', 'ow.ly', 'buff.ly',
      'is.gd', 'v.gd', 'x.co', 'po.st', 'bc.vc', 'cutt.ly'
    ];

    // Expanded suspicious TLDs
    this.suspiciousTLDs = [
      '.tk', '.ml', '.ga', '.cf', '.pw', '.top', '.xyz', '.club',
      '.party', '.work', '.link', '.download', '.faith', '.win',
      '.bid', '.loan', '.racing', '.accountant', '.review', '.cricket',
      '.science', '.date', '.stream', '.trade', '.webcam', '.wang'
    ];
    
    // Brand names commonly impersonated
    this.brandNames = [
      'apple', 'google', 'microsoft', 'amazon', 'paypal', 'netflix',
      'facebook', 'instagram', 'whatsapp', 'twitter', 'linkedin',
      'chase', 'wellsfargo', 'bankofamerica', 'citibank', 'hsbc',
      'fedex', 'dhl', 'ups', 'usps', 'irs', 'uscis'
    ];
    
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
    
    console.log(`🔍 URL Analysis for: ${url.substring(0, 50)}...`);
    console.log(`📊 Initial risk score: ${riskScore.toFixed(3)}`);
    
    // If trained model is available, use it for enhanced prediction
    if (this.trainedModel) {
      try {
        const mlScore = this.predictWithTrainedModel(features);
        console.log(`🤖 ML model score: ${mlScore.toFixed(3)}`);
        // Weighted combination: 30% rule-based, 70% ML
        riskScore = (riskScore * 0.3) + (mlScore * 0.7);
        console.log(`⚖️ Combined score: ${riskScore.toFixed(3)}`);
      } catch (error) {
        console.warn('ML prediction failed, using rule-based analysis:', error.message);
      }
    }
    
    // CRITICAL: Lower threshold for detection
    const isSuspicious = riskScore > 0.4; // Changed from 0.5 to 0.4
    const severity = riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low';
    
    console.log(`🎯 Final decision: ${isSuspicious ? 'SUSPICIOUS' : 'SAFE'} (severity: ${severity})`);
    
    return {
      isSuspicious: isSuspicious,
      severity: severity,
      confidence: Math.min(riskScore + 0.15, 1.0), // Increased confidence
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

    let score = 0;
    const topFeatures = this.trainedModel.top_features.slice(0, 20); // Use more features
    
    for (const [featureName, importance] of topFeatures) {
      const featureValue = this.getFeatureValue(features, featureName);
      const maxImportance = Math.max(...topFeatures.map(f => f[1]));
      const normalizedImportance = importance / maxImportance;
      
      if (this.isHighRiskFeature(featureName, featureValue)) {
        score += normalizedImportance * 0.25; // Increased weight
      }
    }

    return Math.min(score, 1.0);
  }

  getFeatureValue(features, featureName) {
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
      'digit_ratio': features.digitRatio || 0,
      'has_suspicious_tld': features.hasSuspiciousTLD ? 1 : 0,
      'has_brand_name': features.hasBrandName ? 1 : 0
    };

    return featureMapping[featureName] || 0;
  }

  isHighRiskFeature(featureName, value) {
    const riskThresholds = {
      'url_length': 80,      // Lowered from 100
      'has_ip': 0.5,
      'is_shortener': 0.5,
      'suspicious_keyword_count': 1,
      'subdomain_count': 2,  // Lowered from 3
      'has_port': 0.5,
      'is_https': -1,
      'dot_count': 4,        // Lowered from 5
      'hyphen_count': 3,     // Lowered from 5
      'special_char_ratio': 0.25, // Lowered from 0.3
      'domain_length': 30,   // Lowered from 50
      'path_length': 50,     // Lowered from 100
      'query_length': 30,    // Lowered from 50
      'char_diversity': 0.7,
      'digit_ratio': 0.25,
      'has_suspicious_tld': 0.5,
      'has_brand_name': 0.5
    };

    const threshold = riskThresholds[featureName] || 0;
    
    if (featureName === 'is_https') {
      return value < threshold;
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
      ampersandCount: (url.match(/&/g) || []).length,
      hasBrandName: this.hasBrandNameImpersonation(url),
      hasTyposquatting: this.detectTyposquatting(url)
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
    const reasons = [];

    // CRITICAL: HTTP protocol is a major red flag
    if (!features.isHTTPS) {
      score += 0.4; // Increased from 0.2
      reasons.push('Insecure HTTP protocol');
    }

    // URL length analysis
    if (features.urlLength > 150) {
      score += 0.3;
      reasons.push('Extremely long URL');
    } else if (features.urlLength > 80) {
      score += 0.2; // Increased from 0.15
      reasons.push('Long URL');
    } else if (features.urlLength < 15) {
      score += 0.15;
      reasons.push('Suspiciously short URL');
    }

    // IP address (VERY SUSPICIOUS)
    if (features.hasIP) {
      score += 0.6; // Increased from 0.5
      reasons.push('Uses IP address instead of domain');
    }

    // URL shorteners
    if (features.isShortener) {
      score += 0.5; // Increased from 0.4
      reasons.push('URL shortener detected');
    }

    // Suspicious keywords (CRITICAL)
    if (features.suspiciousKeywordCount > 2) {
      score += 0.5; // Increased
      reasons.push(`Contains ${features.suspiciousKeywordCount} suspicious keywords`);
    } else if (features.suspiciousKeywordCount > 0) {
      score += 0.3; // Increased from 0.25
      reasons.push(`Contains suspicious keywords`);
    }

    // Brand impersonation (CRITICAL)
    if (features.hasBrandName) {
      score += 0.5; // Increased from 0.3
      reasons.push('Possible brand impersonation');
    }

    // Typosquatting detection
    if (features.hasTyposquatting) {
      score += 0.4;
      reasons.push('Possible typosquatting detected');
    }

    // Special character analysis
    if (features.specialCharRatio > 0.35) {
      score += 0.3;
      reasons.push('High ratio of special characters');
    } else if (features.specialCharRatio > 0.2) {
      score += 0.15;
    }

    // Subdomain analysis
    if (features.subdomainCount > 3) {
      score += 0.3;
      reasons.push('Too many subdomains');
    } else if (features.subdomainCount > 1) {
      score += 0.15;
    }

    // Port analysis
    if (features.hasPort) {
      score += 0.25; // Increased from 0.2
      reasons.push('Non-standard port');
    }

    // Suspicious TLD (CRITICAL)
    if (features.hasSuspiciousTLD) {
      score += 0.5; // Increased from 0.4
      reasons.push('Suspicious top-level domain');
    }

    // Excessive special characters
    if (features.dotCount > 5) {
      score += 0.2;
      reasons.push('Excessive dots in URL');
    }
    if (features.hyphenCount > 4) {
      score += 0.2; // Increased from 0.15
      reasons.push('Excessive hyphens');
    }
    if (features.underscoreCount > 2) {
      score += 0.15; // Increased from 0.1
    }

    // Character diversity analysis
    if (features.charDiversity > 0.85 || features.charDiversity < 0.3) {
      score += 0.15; // Increased from 0.1
    }

    // Digit ratio
    if (features.digitRatio > 0.35) {
      score += 0.15; // Increased from 0.1
    }

    // Long query parameters (often used in phishing)
    if (features.queryLength > 50) {
      score += 0.2;
      reasons.push('Long query parameters');
    }

    console.log(`📝 Risk factors detected: ${reasons.join('; ')}`);
    
    return Math.max(0, Math.min(score, 1.0));
  }

  generateReason(features, riskScore) {
    const reasons = [];

    if (!features.isHTTPS) reasons.push('Uses insecure HTTP protocol');
    if (features.hasIP) reasons.push('Uses IP address instead of domain name');
    if (features.isShortener) reasons.push('Known URL shortener service');
    if (features.suspiciousKeywordCount > 0) {
      reasons.push(`Contains ${features.suspiciousKeywordCount} suspicious keyword(s)`);
    }
    if (features.hasBrandName) reasons.push('Possible brand impersonation detected');
    if (features.hasTyposquatting) reasons.push('Possible typosquatting (misspelled domain)');
    if (features.urlLength > 150) reasons.push('Extremely long URL');
    if (features.urlLength > 80) reasons.push('Unusually long URL');
    if (features.urlLength < 15) reasons.push('Suspiciously short URL');
    if (features.specialCharRatio > 0.35) reasons.push('High ratio of special characters');
    if (features.subdomainCount > 3) reasons.push('Too many subdomains');
    if (features.hasPort) reasons.push('Uses non-standard port');
    if (features.hasSuspiciousTLD) reasons.push('Suspicious top-level domain');
    if (features.dotCount > 5) reasons.push('Excessive dots in URL');
    if (features.hyphenCount > 4) reasons.push('Excessive hyphens in URL');
    if (features.queryLength > 50) reasons.push('Long query parameters (common in phishing)');

    if (this.trainedModel && riskScore > 0.4) {
      reasons.push('ML model detected suspicious patterns');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'No suspicious patterns detected';
  }

  // Helper methods
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
    return this.suspiciousTLDs.some(tld => lowerUrl.endsWith(tld) || lowerUrl.includes(tld + '/'));
  }

  hasBrandNameImpersonation(url) {
    const lowerUrl = url.toLowerCase();
    // Check if URL contains brand name but is not the actual brand domain
    for (const brand of this.brandNames) {
      if (lowerUrl.includes(brand)) {
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.toLowerCase();
          // Check if it's not the legitimate domain
          if (!domain.endsWith(brand + '.com') && !domain.endsWith(brand + '.net')) {
            return true;
          }
        } catch {
          return false;
        }
      }
    }
    return false;
  }

  detectTyposquatting(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      // Common typosquatting patterns
      const patterns = [
        /app1e/,      // apple typo (number 1 instead of l)
        /g00gle/,     // google typo (zeros instead of o)
        /micr0soft/,  // microsoft typo
        /amaz0n/,     // amazon typo
        /paypa1/,     // paypal typo
        /netf1ix/     // netflix typo
      ];
      
      return patterns.some(pattern => pattern.test(domain));
    } catch {
      return false;
    }
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