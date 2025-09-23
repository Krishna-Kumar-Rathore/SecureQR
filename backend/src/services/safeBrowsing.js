const axios = require('axios');

class SafeBrowsingService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    this.baseURL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
  }

  async checkURL(url) {
    if (!this.apiKey) {
      console.warn('Google Safe Browsing API key not configured');
      return { safe: true };
    }

    try {
      const requestBody = {
        client: {
          clientId: 'secureqr',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [
            { url: url }
          ]
        }
      };

      const response = await axios.post(`${this.baseURL}?key=${this.apiKey}`, requestBody);

      if (response.data.matches && response.data.matches.length > 0) {
        const match = response.data.matches[0];
        return {
          safe: false,
          threatType: match.threatType
        };
      }

      return { safe: true };
    } catch (error) {
      console.error('Safe Browsing API error:', error);
      throw error;
    }
  }
}

module.exports = new SafeBrowsingService();