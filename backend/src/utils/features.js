function extractFeatures(url) {
  const features = {
    urlLength: url.length,
    dotCount: (url.match(/\./g) || []).length,
    hyphenCount: (url.match(/-/g) || []).length,
    underscoreCount: (url.match(/_/g) || []).length,
    slashCount: (url.match(/\//g) || []).length,
    questionMarkCount: (url.match(/\?/g) || []).length,
    equalCount: (url.match(/=/g) || []).length,
    atCount: (url.match(/@/g) || []).length,
    andCount: (url.match(/&/g) || []).length,
    exclamationCount: (url.match(/!/g) || []).length,
    spaceCount: (url.match(/ /g) || []).length,
    tildeCount: (url.match(/~/g) || []).length,
    commaCount: (url.match(/,/g) || []).length,
    plusCount: (url.match(/\+/g) || []).length,
    asteriskCount: (url.match(/\*/g) || []).length,
    hashCount: (url.match(/#/g) || []).length,
    dollarCount: (url.match(/\$/g) || []).length,
    percentCount: (url.match(/%/g) || []).length,
  };

  // Domain-based features
  try {
    const urlObj = new URL(url);
    features.domainLength = urlObj.hostname.length;
    features.hasIP = /^\d+\.\d+\.\d+\.\d+$/.test(urlObj.hostname);
    features.subdomainCount = urlObj.hostname.split('.').length - 2;
    features.pathLength = urlObj.pathname.length;
    features.queryLength = urlObj.search.length;
    features.fragmentLength = urlObj.hash.length;
  } catch (error) {
    // If URL parsing fails, set default values
    features.domainLength = 0;
    features.hasIP = false;
    features.subdomainCount = 0;
    features.pathLength = 0;
    features.queryLength = 0;
    features.fragmentLength = 0;
  }

  return features;
}

module.exports = { extractFeatures };