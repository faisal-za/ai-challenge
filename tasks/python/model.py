# train_model.py
import pandas as pd
from autogluon.tabular import TabularPredictor
from pymongo import MongoClient
from sklearn.model_selection import train_test_split
from dotenv import load_dotenv
import os
import warnings

# Load environment variables from .env file
load_dotenv()
warnings.filterwarnings('ignore') 

# --- CONFIGURATION FROM ENV ---
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")
S3_MODEL_PATH = os.getenv("S3_MODEL_PATH")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")

LABEL = 'label_diabetes_12m' # New Target
EVAL_METRIC = 'roc_auc'      # Standard metric for binary classification

def get_s3_args():
    """Returns s3_args dictionary for AutoGluon S3/R2 interaction."""
    return {
        'client_kwargs': {'endpoint_url': S3_ENDPOINT_URL},
        'key': S3_ACCESS_KEY,
        'secret': S3_SECRET_KEY,
    }

def fetch_data_from_mongodb():
    """Retrieves and prepares data."""
    print(f"[INFO] Connecting to MongoDB: {DB_NAME}/{COLLECTION_NAME}...")
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        # Fetch all data from collection
        data = list(collection.find({}))
        df = pd.DataFrame(data)

        total_records = len(df)
        print(f"[INFO] Total records in collection: {total_records}")

        # Filter out records with null labels FIRST
        df_labeled = df.dropna(subset=[LABEL])
        labeled_count = len(df_labeled)
        print(f"[INFO] Labeled records: {labeled_count} ({labeled_count/total_records*100:.1f}%)")

        # Drop irrelevant metadata and identifiers
        df_labeled = df_labeled.drop(columns=['_id', 'patient_id', '_indexDate', 'label_reason',
                                              '_featureEngineering', '_labeledAt',
                                              'risk_score'], errors='ignore')

        # Convert target to integer type (required for clean classification)
        df_labeled[LABEL] = df_labeled[LABEL].astype(int)

        print(f"[SUCCESS] Data prepared. Training on {len(df_labeled)} labeled records.")
        return df_labeled

    except Exception as e:
        print(f"[ERROR] MongoDB data retrieval failed: {e}")
        return pd.DataFrame()

def train_autogluon_model(df):
    """Trains, evaluates, and uploads the AutoGluon model to R2."""

    # Train locally first, then upload to R2
    local_path = './ag_local_temp'
    print(f"[INFO] Training model locally at: {local_path}")

    predictor = TabularPredictor(
        label=LABEL,
        eval_metric=EVAL_METRIC,
        path=local_path,
        problem_type='binary'
    )

    print(f"[INFO] Starting AutoGluon training with {len(df)} records...")
    print("[INFO] Using 'best_quality' preset with internal cross-validation")

    predictor.fit(
        train_data=df,  # Use all labeled data - AutoGluon does internal CV
        time_limit=120,
        presets='best_quality',  # Uses bagging with internal k-fold CV
        verbosity=2
    )

    # Get performance metrics from internal validation
    print(f"\n[INFO] Retrieving model performance...")
    leaderboard = predictor.leaderboard(silent=True)
    best_model_score = leaderboard['score_val'].iloc[0]

    # Upload to R2 using s3fs
    print(f"[INFO] Uploading model to R2: {S3_MODEL_PATH}...")
    import s3fs

    s3 = s3fs.S3FileSystem(
        key=S3_ACCESS_KEY,
        secret=S3_SECRET_KEY,
        client_kwargs={'endpoint_url': S3_ENDPOINT_URL}
    )

    # Upload entire model directory to R2
    s3.put(local_path, S3_MODEL_PATH, recursive=True)
    print(f"[SUCCESS] Model uploaded to R2")

    print("\n" + "="*70)
    print("[SUCCESS] TRAINING AND UPLOAD COMPLETE")
    print(f"[RESULT] Best Model CV {EVAL_METRIC.upper()}: {best_model_score:.4f}")
    print(f"[INFO] Total models trained: {len(leaderboard)}")
    print(f"[INFO] Model available at: {S3_MODEL_PATH}")
    print("="*70)

if __name__ == '__main__':
    data_df = fetch_data_from_mongodb()
    if not data_df.empty:
        train_autogluon_model(data_df)