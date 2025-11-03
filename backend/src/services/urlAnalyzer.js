class URLAnalyzer {
  isURL(text) {
    // Try direct URL parsing first
    try {
      new URL(text);
      return true;
    } catch {
      // If direct parsing fails, try extracting URL from text
      const extracted = this.extractURLFromText(text);
      return extracted !== null;
    }
  }

  extractURLFromText(text) {
    // Extract URL from pandas DataFrame format or any text
    // Pattern matches http://, https://, ftp://, and www. URLs
    const urlPattern = /https?:\/\/[^\s\n\r<>"']+|ftp:\/\/[^\s\n\r<>"']+|www\.[^\s\n\r<>"']+\.[a-zA-Z]{2,}/i;
    const match = text.match(urlPattern);
    
    if (match) {
      let url = match[0].trim();
      
      // Clean up common endings that might be captured
      url = url.replace(/[.,;:!?)\]}>"\']$/, '');
      
      // Ensure URL has protocol
      if (url.startsWith('www.')) {
        url = 'http://' + url;
      }
      
      return url;
    }
    
    return null;
  }

  extractDomain(url) {
    try {
      const cleanUrl = this.extractURLFromText(url) || url;
      return new URL(cleanUrl).hostname;
    } catch {
      return null;
    }
  }

  getProtocol(url) {
    try {
      const cleanUrl = this.extractURLFromText(url) || url;
      return new URL(cleanUrl).protocol;
    } catch {
      return null;
    }
  }

  isSecureProtocol(url) {
    return this.getProtocol(url) === 'https:';
  }

  // New method to get clean URL
  getCleanURL(text) {
    // First, try to extract URL from text (handles pandas DataFrame format)
    const extracted = this.extractURLFromText(text);
    if (extracted) {
      return extracted;
    }
    
    // If no URL pattern found, try direct URL parsing
    try {
      new URL(text);
      return text;
    } catch {
      return null;
    }
  }

  // Additional utility method to validate URL format
  isValidURL(url) {
    try {
      const cleanUrl = this.getCleanURL(url);
      if (!cleanUrl) return false;
      
      const urlObj = new URL(cleanUrl);
      return Boolean(urlObj.protocol && urlObj.hostname);
    } catch {
      return false;
    }
  }
}

module.exports = new URLAnalyzer();