import requests
import os
from dotenv import load_dotenv

# Load environment variables (for local testing)
load_dotenv()

# --- Configuration ---
# Use your deployed Render URL for production testing:
BASE_URL = os.getenv("RENDER_BACKEND_URL", "https://hr-recruitment-backend.onrender.com")

# Ensure you have a test file for the API call
TEST_RESUME_PATH = "test_resume.pdf"
TEST_JOB_TITLE = "Senior Python Developer"

def test_1_health_check():
    """Test the basic health of the Django API."""
    print(f"\n--- 1. Testing Health Check: {BASE_URL} ---")
    try:
        # Assuming you have a simple endpoint like /api/status/
        response = requests.get(f"{BASE_URL}/api/status/")
        assert response.status_code == 200
        print("PASS: Health check successful.")
    except Exception as e:
        print(f"FAIL: Health check failed. Error: {e}")

def test_2_create_job_posting():
    """Test creating a required resource (Job Posting) for later tests."""
    print("\n--- 2. Testing Job Posting Creation ---")
    endpoint = f"{BASE_URL}/api/jobs/" # Adjust API endpoint
    
    # Payload for a new job posting
    data = {
        "title": TEST_JOB_TITLE,
        "description": "Django, API, Python expertise required.",
        "requirements": "3+ years Python/Django experience."
    }
    
    response = requests.post(endpoint, json=data)
    
    if response.status_code == 201:
        job_id = response.json().get('id')
        print(f"PASS: Job created successfully. ID: {job_id}")
        return job_id
    else:
        print(f"FAIL: Job creation failed. Status: {response.status_code}, Response: {response.text}")
        return None

def test_3_ai_screening_integration(job_id):
    """Test the core logic: uploading a resume and triggering AI screening."""
    if not job_id:
        print("SKIP: AI test skipped because Job ID is missing.")
        return

    print("\n--- 3. Testing AI Screening Integration ---")
    endpoint = f"{BASE_URL}/api/candidates/screen/" # Adjust API endpoint
    
    try:
        with open(TEST_RESUME_PATH, 'rb') as f:
            files = {'resume_file': (os.path.basename(TEST_RESUME_PATH), f, 'application/pdf')}
            data = {'job_id': job_id}
            
            # This API call handles the resume upload AND calls the Hugging Face API
            response = requests.post(endpoint, files=files, data=data, timeout=30) 
        
        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            # Check for key expected fields from your Hugging Face API response
            if 'score' in result and 'summary' in result:
                print(f"PASS: AI Screening successful. Score: {result.get('score')}")
                print(f"AI Summary Snippet: {result.get('summary')[:50]}...")
            else:
                print(f"FAIL: AI Screening succeeded, but unexpected response format: {result}")
        else:
            print(f"FAIL: AI Screening API failed. Status: {response.status_code}, Response: {response.text}")

    except FileNotFoundError:
        print(f"FATAL: Test file not found at {TEST_RESUME_PATH}")
    except requests.exceptions.Timeout:
        print("FAIL: AI Screening timed out. Hugging Face Space may be slow to wake up.")
    except Exception as e:
        print(f"FAIL: An unexpected error occurred during AI test: {e}")


if __name__ == "__main__":
    # Ensure test_resume.pdf exists for test 3
    if not os.path.exists(TEST_RESUME_PATH):
        print(f"!!! WARNING: Please create a dummy file named '{TEST_RESUME_PATH}' in the root directory for the AI test to run. !!!")
        
    test_1_health_check()
    job_id = test_2_create_job_posting()
    test_3_ai_screening_integration(job_id)