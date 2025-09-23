# ml-training/process_qr_dataset_windows.py (CORRECTED VERSION)
import os
import cv2
import pandas as pd
import numpy as np
from tqdm import tqdm
import json
import re
from urllib.parse import urlparse

def extract_url_from_text(text):
    """Extract the first/primary URL from text (handles pandas DataFrame format)"""
    try:
        if not text or pd.isna(text):
            return None
        
        text_str = str(text).strip()
        
        # URL regex pattern (comprehensive)
        url_pattern = r'https?://[^\s\n\r<>"\']+|ftp://[^\s\n\r<>"\']+|www\.[^\s\n\r<>"\']+\.[a-zA-Z]{2,}'
        
        # Find all URLs in the text
        urls = re.findall(url_pattern, text_str)
        
        if urls:
            # Take the first URL found
            first_url = urls[0].strip()
            
            # Clean up common endings that might be captured
            first_url = re.sub(r'[.,;:!?)\]}>"\']$', '', first_url)
            
            # Ensure URL has protocol
            if first_url.startswith('www.'):
                first_url = 'http://' + first_url
            
            # Validate URL format
            try:
                parsed = urlparse(first_url)
                if parsed.scheme and parsed.netloc:
                    return first_url
            except:
                pass
        
        return None
        
    except Exception as e:
        print(f"Error extracting URL from text: {e}")
        return None

def is_valid_url(url):
    """Validate if extracted URL is properly formatted"""
    try:
        if not url:
            return False
        
        parsed = urlparse(url)
        return bool(parsed.scheme and parsed.netloc)
    except:
        return False

def decode_qr_with_opencv(image_path):
    """Decode QR code using OpenCV QRCodeDetector (Windows compatible)"""
    try:
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            return None
        
        # Initialize QR code detector
        detector = cv2.QRCodeDetector()
        
        # Detect and decode QR code
        data, vertices_array, binary_qrcode = detector.detectAndDecode(image)
        
        if data:
            return data
        
        # Try with different image preprocessing if first attempt fails
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        data, vertices_array, binary_qrcode = detector.detectAndDecode(gray)
        
        if data:
            return data
            
        # Try with enhanced contrast
        enhanced = cv2.equalizeHist(gray)
        data, vertices_array, binary_qrcode = detector.detectAndDecode(enhanced)
        
        return data if data else None
        
    except Exception as e:
        # Suppress individual decode errors
        return None

def decode_qr_with_pil(image_path, error_counter, max_errors=1):
    """Alternative QR decoder using PIL (fallback method)"""
    try:
        from PIL import Image
        import numpy as np
        
        # Open image with PIL
        pil_image = Image.open(image_path)
        
        # Ensure image is in RGB mode
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Convert to OpenCV format safely
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        # Use OpenCV detector
        detector = cv2.QRCodeDetector()
        data, vertices_array, binary_qrcode = detector.detectAndDecode(opencv_image)
        
        return data if data else None
        
    except Exception as e:
        error_counter['count'] += 1
        if error_counter['count'] <= max_errors:
            print(f"⚠️ PIL decode error (showing {error_counter['count']}/{max_errors}): {str(e)[:100]}...")
            if error_counter['count'] == max_errors:
                print(f"🔇 Further PIL errors will be suppressed...")
        return None

def process_qr_dataset(dataset_path):
    """Process QR code dataset and extract clean URLs - Windows Compatible"""
    data = []
    processed_stats = {
        'total_qr_processed': 0,
        'urls_extracted': 0,
        'failed_extractions': 0,
        'genuine_urls': 0,
        'malicious_urls': 0,
        'opencv_decode_success': 0,
        'pil_decode_success': 0,
        'total_decode_failures': 0
    }
    
    # Initialize error counters
    genuine_error_counter = {'count': 0}
    malicious_error_counter = {'count': 0}
    
    # Process genuine/valid QR codes
    genuine_path = os.path.join(dataset_path, "GenuineOrValid")
    if os.path.exists(genuine_path):
        print("\n🔍 Processing genuine QR codes...")
        genuine_files = [f for f in os.listdir(genuine_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff'))]
        total_genuine = min(len(genuine_files), 5000)
        print(f"📂 Found {len(genuine_files)} genuine files, processing first {total_genuine}")
        
        with tqdm(total=total_genuine, desc="✅ Genuine QRs", unit="files") as pbar:
            for i, filename in enumerate(genuine_files[:5000]):
                image_path = os.path.join(genuine_path, filename)
                
                # Decode QR code text
                decoded_text = decode_qr_with_opencv(image_path)
                opencv_success = bool(decoded_text)
                
                if opencv_success:
                    processed_stats['opencv_decode_success'] += 1
                else:
                    # If OpenCV fails, try PIL (FIXED FUNCTION NAME)
                    decoded_text = decode_qr_with_pil(image_path, genuine_error_counter, max_errors=1)
                    if decoded_text:
                        processed_stats['pil_decode_success'] += 1
                    else:
                        processed_stats['total_decode_failures'] += 1
                
                processed_stats['total_qr_processed'] += 1
                
                if decoded_text:
                    # Extract URL from the decoded text
                    extracted_url = extract_url_from_text(decoded_text)
                    
                    if extracted_url and is_valid_url(extracted_url):
                        data.append({
                            'original_text': decoded_text,
                            'extracted_url': extracted_url,
                            'label': 0,  # 0 = genuine/safe
                            'source': 'genuine',
                            'filename': filename
                        })
                        processed_stats['urls_extracted'] += 1
                        processed_stats['genuine_urls'] += 1
                    else:
                        processed_stats['failed_extractions'] += 1
                        # Keep non-URL data for analysis
                        data.append({
                            'original_text': decoded_text,
                            'extracted_url': None,
                            'label': 0,
                            'source': 'genuine',
                            'filename': filename
                        })
                else:
                    processed_stats['failed_extractions'] += 1
                
                # Update progress bar with current stats
                pbar.set_postfix({
                    'URLs': processed_stats['genuine_urls'],
                    'Failures': processed_stats['total_decode_failures']
                })
                pbar.update(1)
    
    # Process malicious QR codes
    malicious_path = os.path.join(dataset_path, "malicious")
    if os.path.exists(malicious_path):
        print("\n🚨 Processing malicious QR codes...")
        malicious_files = [f for f in os.listdir(malicious_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff'))]
        total_malicious = min(len(malicious_files), 5000)
        print(f"📂 Found {len(malicious_files)} malicious files, processing first {total_malicious}")
        
        with tqdm(total=total_malicious, desc="🚨 Malicious QRs", unit="files") as pbar:
            for i, filename in enumerate(malicious_files[:5000]):
                image_path = os.path.join(malicious_path, filename)
                
                # Decode QR code text
                decoded_text = decode_qr_with_opencv(image_path)
                opencv_success = bool(decoded_text)
                
                if opencv_success:
                    processed_stats['opencv_decode_success'] += 1
                else:
                    # If OpenCV fails, try PIL (FIXED FUNCTION NAME)
                    decoded_text = decode_qr_with_pil(image_path, malicious_error_counter, max_errors=1)
                    if decoded_text:
                        processed_stats['pil_decode_success'] += 1
                    else:
                        processed_stats['total_decode_failures'] += 1
                
                processed_stats['total_qr_processed'] += 1
                
                if decoded_text:
                    # Extract URL from the decoded text
                    extracted_url = extract_url_from_text(decoded_text)
                    
                    if extracted_url and is_valid_url(extracted_url):
                        data.append({
                            'original_text': decoded_text,
                            'extracted_url': extracted_url,
                            'label': 1,  # 1 = malicious
                            'source': 'malicious',
                            'filename': filename
                        })
                        processed_stats['urls_extracted'] += 1
                        processed_stats['malicious_urls'] += 1
                    else:
                        processed_stats['failed_extractions'] += 1
                        # Keep non-URL data for analysis
                        data.append({
                            'original_text': decoded_text,
                            'extracted_url': None,
                            'label': 1,
                            'source': 'malicious',
                            'filename': filename
                        })
                else:
                    processed_stats['failed_extractions'] += 1
                
                # Update progress bar with current stats
                pbar.set_postfix({
                    'URLs': processed_stats['malicious_urls'],
                    'Failures': processed_stats['total_decode_failures']
                })
                pbar.update(1)
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Print comprehensive processing statistics
    print(f"\n📊 Processing Statistics:")
    print("=" * 50)
    print(f"📁 Total QR codes processed: {processed_stats['total_qr_processed']:,}")
    print(f"✅ OpenCV decode success: {processed_stats['opencv_decode_success']:,}")
    print(f"🔄 PIL decode success: {processed_stats['pil_decode_success']:,}")
    print(f"❌ Total decode failures: {processed_stats['total_decode_failures']:,}")
    print(f"🔗 URLs successfully extracted: {processed_stats['urls_extracted']:,}")
    print(f"⚠️ Failed URL extractions: {processed_stats['failed_extractions']:,}")
    print(f"🟢 Genuine URLs: {processed_stats['genuine_urls']:,}")
    print(f"🔴 Malicious URLs: {processed_stats['malicious_urls']:,}")
    
    # Calculate success rates
    if processed_stats['total_qr_processed'] > 0:
        decode_success_rate = ((processed_stats['opencv_decode_success'] + processed_stats['pil_decode_success']) / processed_stats['total_qr_processed']) * 100
        url_extraction_rate = (processed_stats['urls_extracted'] / processed_stats['total_qr_processed']) * 100
        print(f"📈 QR decode success rate: {decode_success_rate:.1f}%")
        print(f"🎯 URL extraction success rate: {url_extraction_rate:.1f}%")
    
    if len(df) > 0:
        print(f"\n📈 Dataset Summary:")
        print("=" * 30)
        print(f"Total samples: {len(df):,}")
        print(f"Samples with URLs: {len(df[df['extracted_url'].notna()]):,}")
        print(f"Samples without URLs: {len(df[df['extracted_url'].isna()]):,}")
        
        # Save complete processed dataset
        df.to_csv('processed_qr_dataset_with_urls.csv', index=False)
        print(f"💾 Complete dataset saved to processed_qr_dataset_with_urls.csv")
        
        # Create URL-only dataset for training
        url_df = df[df['extracted_url'].notna()].copy()
        url_df_clean = url_df[['extracted_url', 'label', 'source', 'filename']].copy()
        url_df_clean.rename(columns={'extracted_url': 'url'}, inplace=True)
        
        url_df_clean.to_csv('processed_qr_urls_only.csv', index=False)
        print(f"🎯 URL-only dataset saved to processed_qr_urls_only.csv ({len(url_df_clean):,} URLs)")
        
        # Save processing report
        report = {
            'processing_stats': processed_stats,
            'dataset_summary': {
                'total_samples': len(df),
                'samples_with_urls': len(df[df['extracted_url'].notna()]),
                'samples_without_urls': len(df[df['extracted_url'].isna()]),
                'genuine_samples': len(df[df['label'] == 0]),
                'malicious_samples': len(df[df['label'] == 1])
            },
            'sample_urls': {
                'genuine_urls': df[(df['label'] == 0) & (df['extracted_url'].notna())]['extracted_url'].head(10).tolist(),
                'malicious_urls': df[(df['label'] == 1) & (df['extracted_url'].notna())]['extracted_url'].head(10).tolist()
            },
            'success_rates': {
                'decode_success_rate': decode_success_rate,
                'url_extraction_rate': url_extraction_rate
            } if processed_stats['total_qr_processed'] > 0 else {}
        }
        
        with open('processing_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📋 Processing report saved to processing_report.json")
        
        return df, url_df_clean
    else:
        print("❌ No data processed successfully!")
        return None, None

def load_existing_csv_dataset(csv_path):
    """Load and process existing CSV dataset with pandas DataFrame format"""
    try:
        print(f"📂 Loading existing CSV dataset from: {csv_path}")
        df = pd.read_csv(csv_path)
        
        print(f"✅ Loaded {len(df):,} samples from CSV")
        
        # Extract URLs from the text column
        print("\n🔧 Extracting URLs from text data...")
        extracted_data = []
        url_extraction_stats = {
            'total_processed': 0,
            'urls_found': 0,
            'urls_failed': 0
        }
        
        with tqdm(total=len(df), desc="🔗 Extracting URLs", unit="samples") as pbar:
            for idx, row in df.iterrows():
                text = row['text']
                label = row['label']
                source = row['source']
                filename = row.get('filename', f'{source}_{idx}.png')
                
                # Extract URL from text
                extracted_url = extract_url_from_text(text)
                url_extraction_stats['total_processed'] += 1
                
                if extracted_url and is_valid_url(extracted_url):
                    url_extraction_stats['urls_found'] += 1
                    
                extracted_data.append({
                    'original_text': text,
                    'extracted_url': extracted_url,
                    'label': label,
                    'source': source,
                    'filename': filename
                })
                
                # Update progress bar
                pbar.set_postfix({
                    'URLs Found': url_extraction_stats['urls_found'],
                    'Success Rate': f"{(url_extraction_stats['urls_found']/url_extraction_stats['total_processed'])*100:.1f}%"
                })
                pbar.update(1)
        
        # Create processed DataFrame
        processed_df = pd.DataFrame(extracted_data)
        
        # Print statistics
        total_samples = len(processed_df)
        samples_with_urls = len(processed_df[processed_df['extracted_url'].notna()])
        samples_without_urls = total_samples - samples_with_urls
        success_rate = (samples_with_urls/total_samples)*100
        
        print(f"\n📊 URL Extraction Results:")
        print("=" * 40)
        print(f"📁 Total samples processed: {total_samples:,}")
        print(f"🔗 URLs successfully extracted: {samples_with_urls:,}")
        print(f"❌ Failed extractions: {samples_without_urls:,}")
        print(f"📈 Success rate: {success_rate:.2f}%")
        
        # Break down by category
        genuine_with_urls = len(processed_df[(processed_df['label'] == 0) & (processed_df['extracted_url'].notna())])
        malicious_with_urls = len(processed_df[(processed_df['label'] == 1) & (processed_df['extracted_url'].notna())])
        
        print(f"\n📊 Category Breakdown:")
        print("=" * 30)
        print(f"🟢 Genuine URLs extracted: {genuine_with_urls:,}")
        print(f"🔴 Malicious URLs extracted: {malicious_with_urls:,}")
        
        # Save processed data
        processed_df.to_csv('processed_qr_dataset_with_urls.csv', index=False)
        print(f"\n💾 Processed dataset saved to processed_qr_dataset_with_urls.csv")
        
        # Create URL-only dataset
        url_df = processed_df[processed_df['extracted_url'].notna()].copy()
        url_df_clean = url_df[['extracted_url', 'label', 'source', 'filename']].copy()
        url_df_clean.rename(columns={'extracted_url': 'url'}, inplace=True)
        
        url_df_clean.to_csv('processed_qr_urls_only.csv', index=False)
        print(f"🎯 URL-only dataset saved to processed_qr_urls_only.csv ({len(url_df_clean):,} URLs)")
        
        # Show sample extracted URLs
        print(f"\n📝 Sample Extracted URLs:")
        print("=" * 40)
        if len(url_df_clean) > 0:
            print("🟢 Sample Genuine URLs:")
            genuine_urls = url_df_clean[url_df_clean['label'] == 0]['url'].head(3).tolist()
            for i, url in enumerate(genuine_urls, 1):
                print(f"  {i}. {url}")
            
            print("\n🔴 Sample Malicious URLs:")
            malicious_urls = url_df_clean[url_df_clean['label'] == 1]['url'].head(3).tolist()
            for i, url in enumerate(malicious_urls, 1):
                print(f"  {i}. {url}")
        
        # Save extraction report
        extraction_report = {
            'extraction_stats': url_extraction_stats,
            'summary': {
                'total_samples': total_samples,
                'samples_with_urls': samples_with_urls,
                'samples_without_urls': samples_without_urls,
                'success_rate': success_rate,
                'genuine_urls': genuine_with_urls,
                'malicious_urls': malicious_with_urls
            }
        }
        
        with open('url_extraction_report.json', 'w') as f:
            json.dump(extraction_report, f, indent=2)
        
        print(f"📋 Extraction report saved to url_extraction_report.json")
        
        return processed_df, url_df_clean
        
    except Exception as e:
        print(f"❌ Error loading CSV dataset: {e}")
        return None, None

if __name__ == "__main__":
    print("🔍 SecureQR Dataset Processor with URL Extraction")
    print("=" * 60)
    print("🎯 Optimized for Windows with error suppression")
    print("📊 Enhanced progress tracking and statistics")
    print("=" * 60)
    
    # Check if existing CSV dataset exists
    csv_path = "processed_qr_dataset.csv"
    if os.path.exists(csv_path):
        print("🎉 Found existing processed CSV dataset!")
        print("📄 Loading and extracting URLs from CSV...")
        df, url_df = load_existing_csv_dataset(csv_path)
    else:
        # Check if image dataset exists
        dataset_path = "../dataset/QR Codes"
        
        if os.path.exists(dataset_path):
            print("🎉 Found QR Codes image dataset!")
            print("🖼️ Processing images and extracting URLs...")
            df, url_df = process_qr_dataset(dataset_path)
        else:
            print(f"❌ No dataset found at: {dataset_path}")
            print("📁 Please ensure your dataset is in the correct location:")
            print("   - For CSV: processed_qr_dataset.csv")
            print("   - For Images: ../dataset/QR Codes/")
            exit(1)
    
    if df is not None and url_df is not None:
        print("\n" + "=" * 60)
        print("🎉 PROCESSING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"📁 Files created:")
        print(f"  ✅ processed_qr_dataset_with_urls.csv (complete data)")
        print(f"  ✅ processed_qr_urls_only.csv (URLs for training)")
        print(f"  ✅ processing_report.json (detailed statistics)")
        
        if len(url_df) > 100:
            print(f"\n🚀 READY FOR ML TRAINING!")
            print(f"📊 Dataset contains {len(url_df):,} URL samples")
            print(f"🔥 Run 'python train_model.py' to train ML models")
        else:
            print(f"\n⚠️ WARNING: Only {len(url_df):,} URLs extracted")
            print(f"💡 Consider processing more data for better ML training")
        
        print(f"\n📈 Quick Stats:")
        genuine_count = len(url_df[url_df['label'] == 0])
        malicious_count = len(url_df[url_df['label'] == 1])
        print(f"🟢 Genuine URLs: {genuine_count:,}")
        print(f"🔴 Malicious URLs: {malicious_count:,}")
        balance = min(genuine_count, malicious_count) / max(genuine_count, malicious_count) * 100
        print(f"⚖️ Dataset balance: {balance:.1f}%")
        
    else:
        print("\n" + "=" * 60)
        print("❌ PROCESSING FAILED!")
        print("=" * 60)
        print("💡 Possible issues:")
        print("  - Corrupted QR code images")
        print("  - Incorrect dataset format")
        print("  - Insufficient readable QR codes")
        print("🔧 Try processing a smaller subset or check data quality")