const safeBrowsingService = require('../services/safeBrowsing');
const smartAnalyzer = require('../services/smartAnalyzer');  // ✅ CORRECT
const urlAnalyzer = require('../services/urlAnalyzer');
const upiValidator = require('../utils/upiValidator');


exports.checkURL = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        status: 'error',
        message: 'URL is required'
      });
    }

    // Initialize result object
    let result = {
      status: 'safe',
      contentType: null,
      threatType: null,
      checks: {},
      confidence: 0,
      source: 'analysis'
    };

    // Detect content type
    if (upiValidator.isUPI(url)) {
      result.contentType = 'upi';
      
      // Validate UPI
      const upiValidation = upiValidator.validateUPI(url);
      result.checks.upiFormat = upiValidation.valid;
      
      if (!upiValidation.valid) {
        result.status = 'suspicious';
        result.threatType = 'Invalid UPI format';
      }
    } else if (urlAnalyzer.isURL(url)) {
      result.contentType = 'url';
      
      // Basic protocol check
      if (url.startsWith('http://')) {
        result.status = 'suspicious';
        result.threatType = 'Insecure HTTP protocol';
        result.checks.httpsProtocol = false;
      } else if (url.startsWith('https://')) {
        result.checks.httpsProtocol = true;
      }

      // Check with Google Safe Browsing
      try {
        const safeBrowsingResult = await safeBrowsingService.checkURL(url);
        if (!safeBrowsingResult.safe) {
          result.status = 'malicious';
          result.threatType = safeBrowsingResult.threatType;
          result.source = 'google_safe_browsing';
          result.checks.safeBrowsing = false;
        } else {
          result.checks.safeBrowsing = true;
        }
      } catch (error) {
        console.error('Safe Browsing API error:', error);
        result.checks.safeBrowsing = null;
      }

      // ML Model analysis (if Safe Browsing didn't flag it)
      if (result.status !== 'malicious') {
        try {
          const mlResult = smartAnalyzer.analyzeURL(url);  // ✅ CORRECT
          result.confidence = mlResult.confidence;
          
          if (mlResult.isMalicious) {
            result.status = mlResult.confidence > 0.8 ? 'malicious' : 'suspicious';
            result.threatType = 'ML model detected suspicious patterns';
            result.source = 'ml_model';
          }
          result.checks.mlModel = !mlResult.isMalicious;
        } catch (error) {
          console.error('ML Model error:', error);
          result.checks.mlModel = null;
        }
      }
    } else {
      result.contentType = 'text';
      result.status = 'safe';
      result.threatType = 'Plain text content';
    }

    res.json(result);
  } catch (error) {
    console.error('URL check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};