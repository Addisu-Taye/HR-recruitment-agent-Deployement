import json
import gc
import os
import tempfile 
from typing import Dict, Any, List

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from PyPDF2 import PdfReader 
import requests  # <-- NEW: Required for API calls

# Only import docx if needed
try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    
# --- REMOVED: LangGraph Import ---
# from .langgraph_agent.workflow import recruitment_graph 
# ----------------------------------

from .models import JobPosting, Candidate 
from .tasks import send_shortlist_notification 

# --- CONFIGURATION (Must be set in Render Environment) ---
HF_SPACE_API_URL = os.environ.get("HF_SPACE_API_URL")

# ----------------------------------------------------------------------
## Helper Function for Resume Text Extraction (REMAINS UNCHANGED)
# ----------------------------------------------------------------------

def extract_resume_text(file_path: str, file_extension: str) -> str:
    """Extracts text from PDF, DOCX, or TXT files."""
    resume_text = ""
    MAX_TEXT_LENGTH = 5000
    
    try:
        if file_extension == 'pdf':
            reader = PdfReader(file_path)
            # Limit pages read for speed/memory
            for page in reader.pages[:10]: 
                text = page.extract_text()
                if text:
                    resume_text += text + " "
        
        elif file_extension == 'txt':
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                resume_text = f.read()

        elif file_extension == 'docx':
            if not DOCX_AVAILABLE:
                raise ModuleNotFoundError("DOCX support not installed (missing 'python-docx').")
            doc = Document(file_path)
            resume_text = "\n".join([para.text for para in doc.paragraphs])
            
        else:
            raise ValueError(f"Unsupported file type: .{file_extension}. Must be PDF, DOCX, or TXT.")

        return resume_text.strip()[:MAX_TEXT_LENGTH]
    
    except ModuleNotFoundError:
        raise
    except Exception as e:
        print(f"File parsing error for {file_path}: {e}")
        raise ValueError(f"Could not read resume file: {e}")


# ----------------------------------------------------------------------
## NEW: Function to Call Remote HF API
# ----------------------------------------------------------------------

def run_remote_recruitment(data: Dict[str, str]) -> Dict[str, Any]:
    """Calls the remote Hugging Face Gradio API for screening."""
    if not HF_SPACE_API_URL:
        return {"error": "HF_SPACE_API_URL is not set."}

    # Gradio API expects data in the format: {"data": [arg1, arg2, arg3]}
    payload = {
        "data": [
            data["resume_text"],
            data["job_description"],
            data["job_requirements"]
        ]
    }
    
    try:
        response = requests.post(HF_SPACE_API_URL, json=payload, timeout=30)
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        
        # Gradio API response format is typically {"data": [result_dict]}
        result_data = response.json().get('data', [{}])[0]
        
        # Check for explicit error returned by the Gradio app's logic
        if result_data.get("error"):
            raise Exception(f"Remote App Error: {result_data['error']}")
            
        # Determine final decision based on the score returned by HF app.py (>= 70)
        match_score = float(result_data.get("match_score", 0.0))
        
        # The structure matches the expected output for the database and frontend
        final_state = {
            "match_score": match_score,
            "shortlisted": result_data.get("shortlisted", False),
            "extracted_skills": result_data.get("skills", []),
            "strengths": result_data.get("strengths", []),
            "missing_skills": result_data.get("missing_skills", []),
            "experience_years": 0, # Cannot be extracted remotely with current HF app.py
            "education": "",      # Cannot be extracted remotely with current HF app.py
        }
        return final_state

    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed (check URL/status): {e}"}
    except Exception as e:
        return {"error": f"Remote screening failed: {e}"}


# ----------------------------------------------------------------------
## Primary View: Process Application (Modified)
# ----------------------------------------------------------------------

@csrf_exempt
def process_application(request: HttpRequest):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed. POST only.'}, status=405)
    
    temp_file_name = None
    
    try:
        # 1. Validate Input Data
        job_id = request.POST.get('job_id')
        candidate_name = request.POST.get('name')
        candidate_email = request.POST.get('email')
        resume_file = request.FILES.get('resume')

        if not all([job_id, candidate_name, candidate_email, resume_file]):
            missing_fields = [f for f, v in [('job_id', job_id), ('name', candidate_name), ('email', candidate_email), ('resume', resume_file)] if not v]
            return JsonResponse({'error': f'Missing required fields: {", ".join(missing_fields)}'}, status=400)

        # 2. Save File Temporarily & Extract Text
        file_extension = resume_file.name.lower().split('.')[-1]
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as temp_file:
            for chunk in resume_file.chunks():
                temp_file.write(chunk)
            temp_file_name = temp_file.name
        
        resume_file.seek(0)
        resume_text = extract_resume_text(temp_file_name, file_extension)
        
        if not resume_text:
            return JsonResponse({'error': 'Resume file is empty or text extraction failed.'}, status=400)

        # 3. Get Job Posting
        try:
            job = JobPosting.objects.get(id=job_id, is_published=True)
        except JobPosting.DoesNotExist:
            return JsonResponse({'error': 'Job not found or not published'}, status=404)

        # 4. Run Remote Screening (REPLACES LangGraph)
        input_data = {
            "resume_text": resume_text, 
            "job_description": job.description, 
            "job_requirements": job.requirements,
        }
        
        final_state: Dict[str, Any] = run_remote_recruitment(input_data)

        # Check for remote API error
        if final_state.get('error'):
            return JsonResponse({'error': final_state['error']}, status=500)

        # 5. Save Candidate Data
        candidate = Candidate.objects.create(
            name=candidate_name,
            email=candidate_email,
            resume_file=resume_file, 
            resume_text=resume_text,
            job=job,
            match_score=float(final_state.get("match_score", 0.0)),
            skills=final_state.get("extracted_skills", []),
            experience_years=final_state.get("experience_years", 0),
            education=final_state.get("education", ""),
            shortlisted=final_state.get("shortlisted", False)
        )

        # 6. Post-Processing & Response
        is_shortlisted = final_state.get("shortlisted", False)
        if is_shortlisted:
            send_shortlist_notification.delay(candidate.id) 

        # Ensure lists are returned for frontend compatibility
        strengths_output = final_state.get("strengths", [])
        missing_skills_output = final_state.get("missing_skills", [])
        
        # NOTE: Since your HF app.py returns placeholder lists, the frontend should handle []
        # No need for manual error string replacement here, just use the API output

        return JsonResponse({
            "candidate_id": candidate.id,
            "match_score": round(final_state.get("match_score", 0.0), 1),
            "shortlisted": is_shortlisted,
            "strengths": strengths_output,
            "missing_skills": missing_skills_output
        })

    except ModuleNotFoundError as e:
        return JsonResponse({'error': str(e)}, status=501)
    except (ValueError, requests.exceptions.HTTPError) as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        print(f"FATAL ERROR in process_application: {e}")
        return JsonResponse({'error': 'Internal server error during application processing.'}, status=500)
        
    finally:
        # 7. CLEAN UP
        if temp_file_name and os.path.exists(temp_file_name):
            os.remove(temp_file_name)
        gc.collect()

# ----------------------------------------------------------------------
## API Views (REMAIN UNCHANGED)
# ----------------------------------------------------------------------

def job_listings(request: HttpRequest):
    """View to return a list of active job postings."""
    if request.method == 'GET':
        try:
            from django.db.models import F # Import F for better queryset handling
            jobs_queryset = JobPosting.objects.filter(is_published=True).values(
                'id', 'title', 'department', 'description', 'requirements'
            )
            return JsonResponse({
                "message": f"{len(jobs_queryset)} active job(s) found.",
                "jobs": list(jobs_queryset) 
            })
        except Exception as e:
            print(f"Error fetching job listings: {e}")
            return JsonResponse({'error': 'Internal server error while fetching jobs.'}, status=500)
    return JsonResponse({'error': 'Method not allowed.'}, status=405)


def candidate_list(request: HttpRequest):
    """View to return a list of all candidate records."""
    if request.method == 'GET':
        try:
            candidates = Candidate.objects.all().values(
                'id', 'name', 'email', 'match_score', 'shortlisted',
                'skills', 'job__title'
            )
            return JsonResponse({
                "message": "Candidate list retrieved successfully.",
                "candidates": list(candidates)
            })
        except Exception as e:
            print(f"Error fetching candidate list: {e}")
            return JsonResponse({'error': 'Internal server error while fetching candidates.'}, status=500)
    return JsonResponse({'error': 'Method not allowed.'}, status=405)


def analytics_data(request: HttpRequest):
    """Placeholder view for recruitment analytics API endpoint."""
    if request.method == 'GET':
        try:
            from django.db.models import Avg
            total_candidates = Candidate.objects.count()
            shortlisted_count = Candidate.objects.filter(shortlisted=True).count()
            avg_score = Candidate.objects.aggregate(Avg('match_score'))['match_score__avg']

            return JsonResponse({
                "message": "Analytics data retrieved.", 
                "total_candidates": total_candidates,
                "shortlisted": shortlisted_count,
                "avg_score": avg_score if avg_score is not None else 0.0
            })
        except Exception as e:
            print(f"Error fetching analytics: {e}")
            return JsonResponse({'error': 'Internal server error while fetching analytics.'}, status=500)
    return JsonResponse({'error': 'Method not allowed.'}, status=405)