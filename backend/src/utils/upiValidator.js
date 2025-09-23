class UPIValidator {
  isUPI(text) {
    // Check if text contains UPI payment format
    const upiPatterns = [
      /upi:\/\/pay\?/i,
      /paytm:\/\/pay\?/i,
      /phonepe:\/\/pay\?/i,
      /gpay:\/\/pay\?/i,
      /bhim:\/\/pay\?/i
    ];
    
    return upiPatterns.some(pattern => pattern.test(text));
  }

  validateUPI(upiString) {
    try {
      const url = new URL(upiString);
      const params = new URLSearchParams(url.search);
      
      const requiredParams = ['pa', 'pn'];
      const result = {
        valid: true,
        errors: [],
        vpa: params.get('pa'),
        payeeName: params.get('pn'),
        amount: params.get('am'),
        transactionNote: params.get('tn'),
        merchantCode: params.get('mc')
      };

      // Check required parameters
      requiredParams.forEach(param => {
        if (!params.get(param)) {
          result.valid = false;
          result.errors.push(`Missing required parameter: ${param}`);
        }
      });

      // Validate VPA format
      if (result.vpa && !this.isValidVPA(result.vpa)) {
        result.valid = false;
        result.errors.push('Invalid VPA format');
      }

      // Check for suspicious patterns
      if (result.payeeName && this.hasSuspiciousPatterns(result.payeeName)) {
        result.valid = false;
        result.errors.push('Suspicious payee name detected');
      }

      return result;
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid UPI URL format']
      };
    }
  }

  isValidVPA(vpa) {
    // VPA format: username@bank
    const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return vpaRegex.test(vpa);
  }

  hasSuspiciousPatterns(text) {
    const suspiciousPatterns = [
      /phishing/i,
      /fake/i,
      /scam/i,
      /urgent.*payment/i,
      /verify.*account/i,
      /suspend.*account/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(text));
  }
}

module.exports = new UPIValidator();