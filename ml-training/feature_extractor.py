import re
import urllib.parse
from typing import Dict, Any
import tldextract
from collections import Counter

# Handle numpy import properly
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    import math

def extract_url_features(url: str) -> Dict[str, Any]:
    """Extract comprehensive features from clean URL"""
    features = {}
    
    try:
        # Basic string features
        features.update(_extract_character_features(url))
        
        # URL structure features
        features.update(_extract_structure_features(url))
        
        # Domain analysis features
        features.update(_extract_domain_features(url))
        
        # Security-focused features
        features.update(_extract_security_features(url))
        
        # Statistical features
        features.update(_extract_statistical_features(url))
        
    except Exception as e:
        print(f"Error extracting features from URL {url}: {e}")
        # Return default values for all expected features
        features = _get_default_features()
    
    return features

def _extract_character_features(url: str) -> Dict[str, Any]:
    """Extract basic character count features"""
    chars_to_count = ['.', '-', '_', '/', '?', '=', '@', '&', '!', ' ', '~', ',', '+', '*', '#', '$', '%']
    features = {}
    
    features['url_length'] = len(url)
    for char in chars_to_count:
        feature_name = f"{char.replace('.', 'dot').replace('-', 'hyphen').replace('_', 'underscore').replace('/', 'slash').replace('?', 'question_mark').replace('=', 'equal').replace('@', 'at').replace('&', 'and').replace('!', 'exclamation').replace(' ', 'space').replace('~', 'tilde').replace(',', 'comma').replace('+', 'plus').replace('*', 'asterisk').replace('#', 'hash').replace('$', 'dollar').replace('%', 'percent')}_count"
        features[feature_name] = url.count(char)
    
    return features

def _extract_structure_features(url: str) -> Dict[str, Any]:
    """Extract URL structure features"""
    features = {}
    
    try:
        parsed_url = urllib.parse.urlparse(url)
        features['domain_length'] = len(parsed_url.netloc)
        features['path_length'] = len(parsed_url.path)
        features['query_length'] = len(parsed_url.query)
        features['fragment_length'] = len(parsed_url.fragment)
        features['path_depth'] = len([p for p in parsed_url.path.split('/') if p])
        
        # Protocol features
        features['is_https'] = 1 if parsed_url.scheme == 'https' else 0
        features['is_http'] = 1 if parsed_url.scheme == 'http' else 0
        features['has_port'] = 1 if parsed_url.port else 0
        
    except Exception:
        features.update({
            'domain_length': 0, 'path_length': 0, 'query_length': 0, 
            'fragment_length': 0, 'path_depth': 0, 'is_https': 0, 
            'is_http': 0, 'has_port': 0
        })
    
    return features

def _extract_domain_features(url: str) -> Dict[str, Any]:
    """Extract domain-specific features"""
    features = {}
    
    try:
        extracted = tldextract.extract(url)
        features['subdomain_count'] = len(extracted.subdomain.split('.')) if extracted.subdomain else 0
        features['domain_word_count'] = len(re.findall(r'[a-zA-Z]+', extracted.domain))
        features['tld_length'] = len(extracted.suffix)
        
        # Basic domain features
        features['has_www'] = 1 if 'www.' in url.lower() else 0
        
    except Exception:
        features.update({
            'subdomain_count': 0, 'domain_word_count': 0, 
            'tld_length': 0, 'has_www': 0
        })
    
    return features

def _extract_security_features(url: str) -> Dict[str, Any]:
    """Extract security-related features"""
    features = {}
    
    try:
        parsed_url = urllib.parse.urlparse(url)
        
        # IP address detection
        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        domain_without_port = parsed_url.netloc.split(':')[0]
        features['has_ip'] = 1 if re.match(ip_pattern, domain_without_port) else 0
        
        # Suspicious keyword detection
        suspicious_keywords = [
            'phishing', 'malware', 'virus', 'hack', 'steal', 'password', 
            'account', 'verify', 'urgent', 'limited', 'offer', 'click',
            'winner', 'prize', 'free', 'gift', 'bonus', 'promotion',
            'secure', 'bank', 'paypal', 'amazon', 'google', 'microsoft',
            'update', 'confirm', 'suspend', 'locked', 'temporary'
        ]
        
        url_lower = url.lower()
        features['suspicious_keyword_count'] = sum(1 for keyword in suspicious_keywords if keyword in url_lower)
        
        # URL shortener detection
        shorteners = [
            'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'short.link',
            'tiny.cc', 'lnkd.in', 'rebrand.ly', 'ow.ly', 'buff.ly',
            'is.gd', 'v.gd', 'x.co', 'po.st', 'bc.vc'
        ]
        
        features['is_shortener'] = 1 if any(shortener in url_lower for shortener in shorteners) else 0
        
    except Exception:
        features.update({
            'has_ip': 0, 'suspicious_keyword_count': 0, 'is_shortener': 0
        })
    
    return features

def _extract_statistical_features(url: str) -> Dict[str, Any]:
    """Extract statistical features like ratios and entropy"""
    features = {}
    
    if not url:
        return {'char_diversity': 0, 'digit_ratio': 0, 'letter_ratio': 0, 'special_char_ratio': 0, 'entropy': 0}
    
    url_len = len(url)
    
    # Character diversity
    unique_chars = len(set(url.lower()))
    features['char_diversity'] = unique_chars / url_len
    
    # Character type ratios
    digit_count = sum(1 for char in url if char.isdigit())
    letter_count = sum(1 for char in url if char.isalpha())
    special_count = url_len - digit_count - letter_count
    
    features['digit_ratio'] = digit_count / url_len
    features['letter_ratio'] = letter_count / url_len
    features['special_char_ratio'] = special_count / url_len
    
    # Entropy calculation
    features['entropy'] = _calculate_entropy(url)
    
    return features

def _calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy of the text"""
    if not text:
        return 0.0
    
    char_counts = Counter(text.lower())
    text_length = len(text)
    
    if HAS_NUMPY:
        entropy = -sum((count/text_length) * np.log2(count/text_length) for count in char_counts.values())
    else:
        entropy = -sum((count/text_length) * math.log2(count/text_length) for count in char_counts.values())
    
    return entropy

def _get_default_features() -> Dict[str, Any]:
    """Return default feature values for error cases"""
    feature_names = [
        'url_length', 'dot_count', 'hyphen_count', 'underscore_count', 'slash_count',
        'question_mark_count', 'equal_count', 'at_count', 'and_count', 'exclamation_count',
        'space_count', 'tilde_count', 'comma_count', 'plus_count', 'asterisk_count',
        'hash_count', 'dollar_count', 'percent_count', 'domain_length', 'path_length',
        'query_length', 'fragment_length', 'subdomain_count', 'domain_word_count',
        'tld_length', 'is_https', 'is_http', 'has_port', 'has_ip', 'suspicious_keyword_count',
        'is_shortener', 'char_diversity', 'digit_ratio', 'letter_ratio', 'special_char_ratio',
        'has_www', 'path_depth', 'entropy'
    ]
    
    return {feature_name: 0 for feature_name in feature_names}