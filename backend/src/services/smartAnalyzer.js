class SmartAnalyzer {
  constructor() {
    this.suspiciousKeywords = [
      'phishing', 'malware', 'virus', 'hack', 'steal', 'password', 
      'account', 'verify', 'urgent', 'limited', 'offer', 'click',
      'winner', 'prize', 'free', 'gift', 'bonus', 'promotion',
      'suspend', 'locked', 'confirm', 'update', 'secure', 'bank'
    ];
    
    this.suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'short.link',
      'tiny.cc', 'lnkd.in', 'rebrand.ly', 'ow.ly', 'buff.ly'
    ];

    this.suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf'];
  }

  analyzeURL(url) {
    const features = this.extractFeatures(url);
    const riskScore = this.calculateRiskScore(features);
    
    return {
      isSuspicious: riskScore > 0.5,
      severity: riskScore > 0.8 ? 'high' : riskScore > 0.5 ? 'medium' : 'low',
      confidence: Math.min(riskScore + 0.1, 1.0),
      reason: this.generateReason(features),
      details: features
    };
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
      hasSuspiciousTLD: this.hasSuspiciousTLD(url)
    };

    return features;
  }

  calculateRiskScore(features) {
    let score = 0;

    // URL length penalty
    if (features.urlLength > 200) score += 0.3;
    else if (features.urlLength > 100) score += 0.1;

    // IP address instead of domain
    if (features.hasIP) score += 0.5;

    // URL shorteners
    if (features.isShortener) score += 0.4;

    // Suspicious keywords
    score += Math.min(features.suspiciousKeywordCount * 0.2, 0.6);

    // Too many special characters
    if (features.specialCharCount > 20) score += 0.3;
    else if (features.specialCharCount > 10) score += 0.1;

    // Too many subdomains
    if (features.subdomainCount > 4) score += 0.3;
    else if (features.subdomainCount > 2) score += 0.1;

    // Non-standard ports
    if (features.hasPort) score += 0.2;

    // Suspicious TLD
    if (features.hasSuspiciousTLD) score += 0.4;

    return Math.min(score, 1.0);
  }

  generateReason(features) {
    const reasons = [];

    if (features.hasIP) reasons.push('Uses IP address instead of domain name');
    if (features.isShortener) reasons.push('Known URL shortener service');
    if (features.suspiciousKeywordCount > 0) reasons.push('Contains suspicious keywords');
    if (features.urlLength > 200) reasons.push('Unusually long URL');
    if (features.specialCharCount > 20) reasons.push('Excessive special characters');
    if (features.subdomainCount > 4) reasons.push('Too many subdomains');
    if (features.hasPort) reasons.push('Uses non-standard port');
    if (features.hasSuspiciousTLD) reasons.push('Suspicious top-level domain');

    return reasons.length > 0 ? reasons.join('; ') : 'No suspicious patterns detected';
  }

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
    return this.suspiciousDomains.some(domain => url.toLowerCase().includes(domain));
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
    return this.suspiciousTLDs.some(tld => url.toLowerCase().includes(tld));
  }
}

module.exports = new SmartAnalyzer();