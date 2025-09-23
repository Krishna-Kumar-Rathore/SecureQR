class URLAnalyzer {
  isURL(text) {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  getProtocol(url) {
    try {
      return new URL(url).protocol;
    } catch {
      return null;
    }
  }

  isSecureProtocol(url) {
    return this.getProtocol(url) === 'https:';
  }
}

module.exports = new URLAnalyzer();