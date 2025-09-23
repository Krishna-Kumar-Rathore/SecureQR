# ml-training/feature_extractor.py (Updated for clean URLs)
import re
import urllib.parse
from typing import Dict, Any
import tldextract

def extract_url_features(url: str) -> Dict[str, Any]:
    """Extract comprehensive features from clean URL"""
    features = {}
    
    try:
        # Basic string features
        features['url_length'] = len(url)
        features['dot_count'] = url.count('.')
        features['hyphen_count'] = url.count('-')
        features['underscore_count'] = url.count('_')
        features['slash_count'] = url.count('/')
        features['question_mark_count'] = url.count('?')
        features['equal_count'] = url.count('=')
        features['at_count'] = url.count('@')
        features['and_count'] = url.count('&')
        features['exclamation_count'] = url.count('!')
        features['space_count'] = url.count(' ')
        features['tilde_count'] = url.count('~')
        features['comma_count'] = url.count(',')
        features['plus_count'] = url.count('+')
        features['asterisk_count'] = url.count('*')
        features['hash_count'] = url.count('#')
        features['dollar_count'] = url.count('$')
        features['percent_count'] = url.count('%')
        
        # URL structure features
        parsed_url = urllib.parse.urlparse(url)
        features['domain_length'] = len(parsed_url.netloc)
        features['path_length'] = len(parsed_url.path)
        features['query_length'] = len(parsed_url.query)
        features['fragment_length'] = len(parsed_url.fragment)
        
        # Domain analysis using tldextract
        extracted = tldextract.extract(url)
        features['subdomain_count'] = len(extracted.subdomain.split('.')) if extracted.subdomain else 0
        features['domain_word_count'] = len(re.findall(r'[a-zA-Z]+', extracted.domain))
        features['tld_length'] = len(extracted.suffix)
        
        # Protocol features
        features['is_https'] = 1 if parsed_url.scheme == 'https' else 0
        features['is_http'] = 1 if parsed_url.scheme == 'http' else 0
        features['has_port'] = 1 if parsed_url.port else 0
        
        # IP address detection
        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        features['has_ip'] = 1 if re.match(ip_pattern, parsed_url.netloc.split(':')[0]) else 0
        
        # Suspicious keyword features
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
        
        # Character diversity and ratios
        unique_chars = len(set(url.lower()))
        features['char_diversity'] = unique_chars / len(url) if len(url) > 0 else 0
        
        # Digit ratio
        digit_count = sum(1 for char in url if char.isdigit())
        features['digit_ratio'] = digit_count / len(url) if len(url) > 0 else 0
        
        # Letter ratio
        letter_count = sum(1 for char in url if char.isalpha())
        features['letter_ratio'] = letter_count / len(url) if len(url) > 0 else 0
        
        # Special character ratio
        special_count = len(url) - digit_count - letter_count
        features['special_char_ratio'] = special_count / len(url) if len(url) > 0 else 0
        
        # Domain reputation features (basic)
        features['has_www'] = 1 if 'www.' in url_lower else 0
        features['path_depth'] = len([p for p in parsed_url.path.split('/') if p])
        
        # Entropy (randomness measure)
        from collections import Counter
        char_counts = Counter(url.lower())
        url_length = len(url)
        entropy = -sum((count/url_length) * np.log2(count/url_length) for count in char_counts.values())
        features['entropy'] = entropy
        
    except Exception as e:
        print(f"Error extracting features from URL {url}: {e}")
        # Set default values for failed feature extraction
        default_features = [
            'url_length', 'dot_count', 'hyphen_count', 'underscore_count', 'slash_count',
            'question_mark_count', 'equal_count', 'at_count', 'and_count', 'exclamation_count',
            'space_count', 'tilde_count', 'comma_count', 'plus_count', 'asterisk_count',
            'hash_count', 'dollar_count', 'percent_count', 'domain_length', 'path_length',
            'query_length', 'fragment_length', 'subdomain_count', 'domain_word_count',
            'tld_length', 'is_https', 'is_http', 'has_port', 'has_ip', 'suspicious_keyword_count',
            'is_shortener', 'char_diversity', 'digit_ratio', 'letter_ratio', 'special_char_ratio',
            'has_www', 'path_depth', 'entropy'
        ]
        
        for feature_name in default_features:
            if feature_name not in features:
                features[feature_name] = 0
    
    return features

# Import numpy for entropy calculation
try:
    import numpy as np
except ImportError:
    # If numpy not available, set entropy to 0
    def extract_url_features(url: str) -> Dict[str, Any]:
        features = extract_url_features_without_entropy(url)
        features['entropy'] = 0
        return features