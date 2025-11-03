const safeBrowsingService = require('../services/safeBrowsing');
const smartAnalyzer = require('../services/smartAnalyzer');
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

    // Extract clean URL from text (handles pandas DataFrame format)
    const cleanURL = urlAnalyzer.getCleanURL(url);
    const analyzingURL = cleanURL || url;

    console.log(`🔍 Analyzing: ${analyzingURL}`);

    // Initialize result object
    let result = {
      status: 'safe',
      contentType: null,
      threatType: null,
      checks: {},
      confidence: 0,
      source: 'analysis',
      originalText: url !== analyzingURL ? url : undefined,
      analyzedURL: cleanURL || undefined
    };

    // Detect content type
    if (upiValidator.isUPI(analyzingURL)) {
      result.contentType = 'upi';
      
      // Validate UPI
      const upiValidation = upiValidator.validateUPI(analyzingURL);
      result.checks.upiFormat = upiValidation.valid;
      
      if (!upiValidation.valid) {
        result.status = 'suspicious';
        result.threatType = 'Invalid UPI format';
        result.confidence = 0.7;
      } else {
        result.confidence = 0.9;
      }
      
      console.log(`✅ UPI Analysis complete: ${result.status}`);
      
    } else if (cleanURL || urlAnalyzer.isURL(analyzingURL)) {
      result.contentType = 'url';
      
      // Basic protocol check
      if (analyzingURL.startsWith('http://') && !analyzingURL.startsWith('https://')) {
        result.status = 'suspicious';
        result.threatType = 'Insecure HTTP protocol';
        result.checks.httpsProtocol = false;
        result.confidence = 0.45;
        console.log(`⚠️ HTTP protocol detected (insecure)`);
      } else if (analyzingURL.startsWith('https://')) {
        result.checks.httpsProtocol = true;
        console.log(`✅ HTTPS protocol detected (secure)`);
      }

      // Check with Google Safe Browsing
      try {
        console.log(`🔍 Checking with Google Safe Browsing...`);
        const safeBrowsingResult = await safeBrowsingService.checkURL(analyzingURL);
        
        if (!safeBrowsingResult.safe) {
          result.status = 'malicious';
          result.threatType = safeBrowsingResult.threatType || 'Malicious URL detected by Google Safe Browsing';
          result.source = 'google_safe_browsing';
          result.checks.safeBrowsing = false;
          result.confidence = 0.95;
          console.log(`🚨 Google Safe Browsing flagged as: ${safeBrowsingResult.threatType}`);
        } else {
          result.checks.safeBrowsing = true;
          console.log(`✅ Google Safe Browsing: Clean`);
        }
      } catch (error) {
        console.error('❌ Safe Browsing API error:', error.message);
        result.checks.safeBrowsing = null;
      }

      // Smart URL analysis (always run for comprehensive detection)
      try {
        console.log(`🤖 Running Smart Analyzer (ML + Rule-based)...`);
        const analysisResult = smartAnalyzer.analyzeURL(analyzingURL);
        
        console.log(`📊 Smart Analysis Result:`, {
          isSuspicious: analysisResult.isSuspicious,
          severity: analysisResult.severity,
          confidence: analysisResult.confidence.toFixed(3),
          riskScore: analysisResult.riskScore.toFixed(3),
          mlModelUsed: analysisResult.mlModelUsed
        });
        
        // Set smartAnalyzer check status
        // true = no threats detected (PASS)
        // false = threats detected (FAIL)
        result.checks.smartAnalyzer = !analysisResult.isSuspicious;
        
        // Update status based on ML analysis
        if (analysisResult.isSuspicious) {
          // Override status if ML finds something more severe
          if (result.status === 'safe') {
            result.status = analysisResult.severity === 'high' ? 'malicious' : 'suspicious';
            result.threatType = analysisResult.reason;
            result.source = 'smart_analyzer';
            result.confidence = analysisResult.confidence;
          } else if (result.status === 'suspicious' && analysisResult.severity === 'high') {
            result.status = 'malicious';
            result.threatType = analysisResult.reason;
            result.source = 'smart_analyzer';
            result.confidence = analysisResult.confidence;
          } else {
            // Combine threat descriptions
            if (result.threatType && !result.threatType.includes(analysisResult.reason)) {
              result.threatType = `${result.threatType}; ${analysisResult.reason}`;
            }
            result.confidence = Math.max(result.confidence, analysisResult.confidence);
          }
          
          console.log(`⚠️ Smart Analyzer detected threats: ${analysisResult.severity} severity`);
        } else {
          // No threats found by ML
          if (result.status === 'safe') {
            result.confidence = analysisResult.confidence;
          }
          console.log(`✅ Smart Analyzer: No threats detected`);
        }
        
        // Add detailed analysis information
        result.analysis = {
          reason: analysisResult.reason,
          riskScore: analysisResult.riskScore,
          mlModelUsed: analysisResult.mlModelUsed,
          severity: analysisResult.severity,
          details: analysisResult.details
        };
        
      } catch (error) {
        console.error('❌ Smart analyzer error:', error);
        result.checks.smartAnalyzer = null;
      }
      
    } else {
      // Plain text content (no URL detected)
      result.contentType = 'text';
      result.status = 'safe';
      result.threatType = 'Plain text content - no URL detected';
      result.confidence = 0.5;
      console.log(`ℹ️ Plain text detected, no URL found`);
    }

    // Final logging
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ ANALYSIS COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`URL: ${analyzingURL.substring(0, 50)}...`);
    console.log(`Status: ${result.status.toUpperCase()}`);
    console.log(`Confidence: ${Math.round(result.confidence * 100)}%`);
    console.log(`Source: ${result.source}`);
    console.log(`Checks: HTTPS=${result.checks.httpsProtocol}, SafeBrowsing=${result.checks.safeBrowsing}, ML=${result.checks.smartAnalyzer}`);
    console.log(`${'='.repeat(60)}\n`);

    res.json(result);
    
  } catch (error) {
    console.error('❌ URL check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

