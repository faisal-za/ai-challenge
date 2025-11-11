#!/usr/bin/env python3
"""
AutoGluon Diabetes Risk Inference API

Simple inference: features in → risk out
No MongoDB lookups, no patient_id required
"""

import json
import sys
import argparse
import os
import warnings
from typing import Dict, Any, Optional

import pandas as pd
from autogluon.tabular import TabularPredictor

warnings.filterwarnings('ignore')

# Configuration from environment
S3_MODEL_PATH = os.getenv("S3_MODEL_PATH")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")

# Global model cache (lazy load)
_PREDICTOR: Optional[TabularPredictor] = None


def get_s3_args() -> Dict[str, Any]:
    """Returns s3_args dictionary for AutoGluon R2/S3 interaction."""
    return {
        'client_kwargs': {'endpoint_url': S3_ENDPOINT_URL},
        'key': S3_ACCESS_KEY,
        'secret': S3_SECRET_KEY,
    }


def load_model() -> TabularPredictor:
    """Load AutoGluon model from R2 (cached)."""
    global _PREDICTOR

    if _PREDICTOR is None:
        import s3fs
        import tempfile
        import os

        print(f"[INFO] Downloading model from R2: {S3_MODEL_PATH}...", file=sys.stderr)

        s3 = s3fs.S3FileSystem(
            key=S3_ACCESS_KEY,
            secret=S3_SECRET_KEY,
            client_kwargs={'endpoint_url': S3_ENDPOINT_URL}
        )

        # Create temp directory for model
        temp_dir = tempfile.mkdtemp(prefix='ag_model_')

        # S3 path format: s3://bucket/path/to/model
        # Extract bucket and path
        s3_path = S3_MODEL_PATH.replace('s3://', '')

        print(f"[INFO] Downloading from: {s3_path}", file=sys.stderr)

        # Download entire model directory from R2
        # s3fs.get downloads to the parent directory, so we need to handle the nesting
        s3.get(s3_path, temp_dir, recursive=True)

        # Find the actual model directory (might be nested)
        # Look for predictor.pkl or utils/ directory
        model_path = temp_dir
        for root, dirs, files in os.walk(temp_dir):
            if 'predictor.pkl' in files or 'utils' in dirs:
                model_path = root
                break

        print(f"[INFO] Loading model from: {model_path}", file=sys.stderr)
        _PREDICTOR = TabularPredictor.load(path=model_path)

        print("[SUCCESS] Model loaded successfully", file=sys.stderr)

    return _PREDICTOR


def calculate_data_availability(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate data availability metadata for confidence scoring.

    Args:
        features: Dictionary of feature values

    Returns:
        Dictionary with completeness metrics
    """
    # Expected features count (23 total)
    total_features = 23

    # Count non-null features
    non_null_count = sum(1 for v in features.values() if v is not None and pd.notna(v))
    missing_count = total_features - non_null_count

    # Calculate completeness score (0-1)
    completeness = non_null_count / total_features

    # Check critical features (glucose, HbA1c, BMI mean)
    critical_features = [
        features.get('glucose_fasting_mean_365d'),
        features.get('hba1c_prev_mean_365d'),
        features.get('bmi_mean_365d'),
    ]
    critical_present = all(v is not None and pd.notna(v) for v in critical_features)

    # Determine confidence tier
    if completeness >= 0.8:
        confidence_tier = 'high'
    elif completeness >= 0.5:
        confidence_tier = 'medium'
    else:
        confidence_tier = 'low'

    return {
        'data_completeness_score': round(completeness, 3),
        'missing_feature_count': missing_count,
        'confidence_tier': confidence_tier,
        'critical_features_present': critical_present,
    }


def score(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main inference function.

    Args:
        payload: {
            "features": {
                "age_years_at_index": 45.0,
                "sex_male": 1.0,
                "bmi_mean_365d": 28.5,
                ...
            },
            "patient_id": "optional-id-for-logging"
        }

    Returns:
        {
            "predicted_class": 0 or 1,
            "probability_negative": 0.75,
            "probability_positive": 0.25,
            "data_completeness_score": 0.913,
            "confidence_tier": "high",
            "critical_features_present": true
        }
    """
    # Validate input
    if "features" not in payload:
        raise ValueError("Missing 'features' field in input payload")

    features = payload["features"]
    patient_id = payload.get("patient_id", "unknown")

    # Calculate data availability metrics
    availability = calculate_data_availability(features)

    # Load model
    predictor = load_model()

    # Convert features dict to DataFrame (single row)
    df = pd.DataFrame([features])

    print(f"[INFO] Predicting for patient_id={patient_id}, features={len(features)}, completeness={availability['data_completeness_score']}", file=sys.stderr)

    # Predict
    pred_class = int(predictor.predict(df).iloc[0])
    pred_proba = predictor.predict_proba(df)

    # Get probability of positive class (diabetes=1)
    if 1 in pred_proba.columns:
        prob_positive = float(pred_proba[1].iloc[0])
        prob_negative = float(pred_proba[0].iloc[0])
    else:
        # Fallback: take last column as positive class
        prob_positive = float(pred_proba.iloc[0, -1])
        prob_negative = float(pred_proba.iloc[0, 0])

    # Return model outputs + confidence metrics
    output = {
        "predicted_class": pred_class,
        "probability_negative": prob_negative,
        "probability_positive": prob_positive,
        "data_completeness_score": availability['data_completeness_score'],
        "confidence_tier": availability['confidence_tier'],
        "critical_features_present": availability['critical_features_present'],
    }

    return output

def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="AutoGluon Diabetes Risk Inference")
    parser.add_argument("--json", type=str, required=True, help="JSON input payload")
    args = parser.parse_args()

    try:
        # Parse input
        payload = json.loads(args.json)

        # Run inference
        result = score(payload)

        # Output JSON to stdout
        print(json.dumps(result))

    except Exception as e:
        # Error output to stderr
        error_result = {"error": str(e)}
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
