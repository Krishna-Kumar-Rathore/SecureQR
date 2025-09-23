# ml-training/train_model.py (Updated for URL-only dataset)
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score
import xgboost as xgb
import lightgbm as lgb
import json
import joblib
from feature_extractor import extract_url_features
from tqdm import tqdm
import matplotlib.pyplot as plt
import seaborn as sns
import os


def prepare_features(df):
    """Extract features from clean URL data"""
    print("🔧 Extracting features from URLs...")
    
    features_list = []
    failed_extractions = 0
    
    for idx, row in tqdm(enumerate(df.itertuples()), total=len(df), desc="Feature extraction"):
        try:
            url = row.url
            features = extract_url_features(url)
            features_list.append(features)
        except Exception as e:
            print(f"Error processing URL at index {idx}: {e}")
            failed_extractions += 1
            # Add empty features for failed extractions
            features_list.append({})
    
    # Convert to DataFrame
    features_df = pd.DataFrame(features_list)
    
    # Fill missing values with 0
    features_df = features_df.fillna(0)
    
    print(f"✅ Features extracted: {features_df.shape[1]} features for {features_df.shape[0]} samples")
    print(f"❌ Failed extractions: {failed_extractions}")
    
    return features_df

def train_models(X, y):
    """Train multiple models and return the best one"""
    print("\n🚀 Training multiple models...")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    models = {}
    
    # Random Forest
    print("🌲 Training Random Forest...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    rf_proba = rf_model.predict_proba(X_test)[:, 1]
    rf_accuracy = accuracy_score(y_test, rf_pred)
    rf_auc = roc_auc_score(y_test, rf_proba)
    models['RandomForest'] = {
        'model': rf_model, 
        'accuracy': rf_accuracy, 
        'auc': rf_auc,
        'predictions': rf_pred,
        'probabilities': rf_proba
    }
    
    # Gradient Boosting
    print("⚡ Training Gradient Boosting...")
    gb_model = GradientBoostingClassifier(random_state=42)
    gb_model.fit(X_train, y_train)
    gb_pred = gb_model.predict(X_test)
    gb_proba = gb_model.predict_proba(X_test)[:, 1]
    gb_accuracy = accuracy_score(y_test, gb_pred)
    gb_auc = roc_auc_score(y_test, gb_proba)
    models['GradientBoosting'] = {
        'model': gb_model, 
        'accuracy': gb_accuracy, 
        'auc': gb_auc,
        'predictions': gb_pred,
        'probabilities': gb_proba
    }
    
    # Logistic Regression
    print("📈 Training Logistic Regression...")
    lr_model = LogisticRegression(random_state=42, max_iter=1000)
    lr_model.fit(X_train, y_train)
    lr_pred = lr_model.predict(X_test)
    lr_proba = lr_model.predict_proba(X_test)[:, 1]
    lr_accuracy = accuracy_score(y_test, lr_pred)
    lr_auc = roc_auc_score(y_test, lr_proba)
    models['LogisticRegression'] = {
        'model': lr_model, 
        'accuracy': lr_accuracy, 
        'auc': lr_auc,
        'predictions': lr_pred,
        'probabilities': lr_proba
    }
    
    # Try XGBoost if available
    try:
        print("🎯 Training XGBoost...")
        xgb_model = xgb.XGBClassifier(random_state=42, eval_metric='logloss')
        xgb_model.fit(X_train, y_train)
        xgb_pred = xgb_model.predict(X_test)
        xgb_proba = xgb_model.predict_proba(X_test)[:, 1]
        xgb_accuracy = accuracy_score(y_test, xgb_pred)
        xgb_auc = roc_auc_score(y_test, xgb_proba)
        models['XGBoost'] = {
            'model': xgb_model, 
            'accuracy': xgb_accuracy, 
            'auc': xgb_auc,
            'predictions': xgb_pred,
            'probabilities': xgb_proba
        }
    except Exception as e:
        print(f"⚠️ XGBoost training failed: {e}")
    
    # Try LightGBM if available
    try:
        print("💡 Training LightGBM...")
        lgb_model = lgb.LGBMClassifier(random_state=42, verbose=-1)
        lgb_model.fit(X_train, y_train)
        lgb_pred = lgb_model.predict(X_test)
        lgb_proba = lgb_model.predict_proba(X_test)[:, 1]
        lgb_accuracy = accuracy_score(y_test, lgb_pred)
        lgb_auc = roc_auc_score(y_test, lgb_proba)
        models['LightGBM'] = {
            'model': lgb_model, 
            'accuracy': lgb_accuracy, 
            'auc': lgb_auc,
            'predictions': lgb_pred,
            'probabilities': lgb_proba
        }
    except Exception as e:
        print(f"⚠️ LightGBM training failed: {e}")
    
    # Find best model based on AUC score
    best_model_name = max(models.keys(), key=lambda x: models[x]['auc'])
    best_model = models[best_model_name]
    
    # Print results
    print(f"\n📊 Model Performance Comparison:")
    print("-" * 60)
    print(f"{'Model':<20} {'Accuracy':<12} {'AUC Score':<12}")
    print("-" * 60)
    for name, model_info in models.items():
        print(f"{name:<20} {model_info['accuracy']:<12.4f} {model_info['auc']:<12.4f}")
    print("-" * 60)
    
    print(f"\n🏆 Best Model: {best_model_name}")
    print(f"🎯 Best Accuracy: {best_model['accuracy']:.4f}")
    print(f"📈 Best AUC Score: {best_model['auc']:.4f}")
    
    # Detailed report for best model
    print(f"\n📋 Detailed Classification Report for {best_model_name}:")
    print(classification_report(y_test, best_model['predictions'], target_names=['Safe', 'Malicious']))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, best_model['predictions'])
    print(f"\n🔍 Confusion Matrix for {best_model_name}:")
    print(f"True Negatives: {cm[0,0]}, False Positives: {cm[0,1]}")
    print(f"False Negatives: {cm[1,0]}, True Positives: {cm[1,1]}")
    
    return best_model['model'], X_test, y_test, best_model_name, models

def save_model_for_nodejs(model, feature_names, model_name, model_performance):
    """Save model in a format that can be used by Node.js"""
    
    print(f"\n💾 Saving model for Node.js integration...")
    
    # Create models directory
    os.makedirs('../backend/src/models', exist_ok=True)
    
    # Model metadata for Node.js
    model_data = {
        'model_type': model_name,
        'feature_names': feature_names.tolist(),
        'feature_count': len(feature_names),
        'model_info': {
            'algorithm': model_name,
            'version': '2.0.0',
            'training_date': pd.Timestamp.now().isoformat(),
            'performance': model_performance
        },
        'thresholds': {
            'high_risk': 0.8,
            'medium_risk': 0.6,
            'low_risk': 0.4
        }
    }
    
    # Extract feature importance if available
    if hasattr(model, 'feature_importances_'):
        feature_importance = dict(zip(feature_names, model.feature_importances_))
        top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:20]
        model_data['top_features'] = top_features
        model_data['all_feature_importance'] = feature_importance
    
    # Save model metadata
    with open('../backend/src/models/trained_model.json', 'w') as f:
        json.dump(model_data, f, indent=2)
    
    # Save the actual model using joblib
    joblib.dump(model, '../backend/src/models/trained_model.pkl')
    
    # Save feature names separately
    with open('../backend/src/models/feature_names.json', 'w') as f:
        json.dump(feature_names.tolist(), f)
    
    print(f"✅ Model saved successfully!")
    print(f"📁 Files created:")
    print(f"  - ../backend/src/models/trained_model.json (metadata)")
    print(f"  - ../backend/src/models/trained_model.pkl (model)")
    print(f"  - ../backend/src/models/feature_names.json (features)")

def main():
    print("🎯 SecureQR ML Model Training")
    print("=" * 50)
    
    # Load URL-only dataset
    try:
        df = pd.read_csv('processed_qr_urls_only.csv')
        print(f"📂 Loaded dataset: {len(df)} URL samples")
    except FileNotFoundError:
        print("❌ processed_qr_urls_only.csv not found.")
        print("Please run process_qr_dataset_windows.py first.")
        return
    
    # Display dataset info
    print(f"\n📊 Dataset Information:")
    print(f"Total URLs: {len(df)}")
    print(f"Safe URLs: {len(df[df['label'] == 0])}")
    print(f"Malicious URLs: {len(df[df['label'] == 1])}")
    print(f"Class balance: {len(df[df['label'] == 0])/len(df)*100:.1f}% safe, {len(df[df['label'] == 1])/len(df)*100:.1f}% malicious")
    
    # Check minimum dataset size
    if len(df) < 100:
        print("⚠️ Warning: Dataset too small for reliable training (< 100 samples)")
        print("Consider processing more QR code images.")
        return
    
    # Extract features
    features_df = prepare_features(df)
    
    if features_df.empty:
        print("❌ No features extracted. Exiting.")
        return
    
    # Prepare training data
    X = features_df
    y = df['label'].values
    
    print(f"\n📈 Training Data:")
    print(f"Feature matrix shape: {X.shape}")
    print(f"Features: {list(X.columns)}")
    print(f"Class distribution: Safe={np.sum(y==0)}, Malicious={np.sum(y==1)}")
    
    # Train models
    best_model, X_test, y_test, model_name, all_models = train_models(X, y)
    
    # Prepare performance data
    model_performance = {
        'accuracy': float(all_models[model_name]['accuracy']),
        'auc_score': float(all_models[model_name]['auc']),
        'training_samples': len(X),
        'test_samples': len(X_test)
    }
    
    # Save model for Node.js
    save_model_for_nodejs(best_model, X.columns, model_name, model_performance)
    
    # Save training report
    training_report = {
        'dataset_info': {
            'total_samples': len(df),
            'safe_samples': len(df[df['label'] == 0]),
            'malicious_samples': len(df[df['label'] == 1]),
            'features_count': len(X.columns)
        },
        'model_comparison': {
            name: {
                'accuracy': float(info['accuracy']),
                'auc_score': float(info['auc'])
            } for name, info in all_models.items()
        },
        'best_model': {
            'name': model_name,
            'performance': model_performance
        },
        'feature_names': X.columns.tolist()
    }
    
    with open('training_report.json', 'w') as f:
        json.dump(training_report, f, indent=2)
    
    print(f"\n🎉 Training completed successfully!")
    print(f"📋 Training report saved to training_report.json")
    print(f"🚀 Model ready for integration with SecureQR backend!")

if __name__ == "__main__":
    main()