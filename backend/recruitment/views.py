import time
import requests
import logging

logger = logging.getLogger(__name__)

def run_remote_recruitment(data: Dict[str, str]) -> Dict[str, Any]:
    """Calls the remote Hugging Face Gradio API for screening with retry and exponential backoff."""

    if not HF_SPACE_API_URL:
        logger.error("HF_SPACE_API_URL is missing. Check Render environment vars.")
        return {"error": "AI Service URL not configured."}

    payload = {
        "data": [
            data.get("resume_text", ""),
            data.get("job_description", ""),
            data.get("job_requirements", "")
        ]
    }

    max_retries = 5
    base_delay = 1  # seconds

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Calling HF Space (Attempt {attempt}/{max_retries})...")

            response = requests.post(
                HF_SPACE_API_URL,
                json=payload,
                timeout=30
            )

            # Retry only on server errors (5xx)
            if 500 <= response.status_code < 600:
                raise requests.exceptions.HTTPError(
                    f"Server error {response.status_code}"
                )

            response.raise_for_status()

            # Parse response JSON
            data = response.json()

            if "data" not in data or not data["data"]:
                raise ValueError("Invalid AI response format: missing 'data' field.")

            result_data = data["data"][0]

            if result_data.get("error"):
                raise ValueError(f"Remote App Error: {result_data['error']}")

            final_state = {
                "match_score": float(result_data.get("match_score", 0.0)),
                "shortlisted": result_data.get("shortlisted", False),
                "extracted_skills": result_data.get("skills", []),
                "strengths": result_data.get("strengths", []),
                "missing_skills": result_data.get("missing_skills", []),
                "experience_years": result_data.get("experience_years", 0),
                "education": result_data.get("education", "")
            }

            return final_state

        except (requests.exceptions.ConnectionError,
                requests.exceptions.Timeout,
                requests.exceptions.HTTPError) as e:

            logger.warning(f"AI call failed: {e}. Retrying... ({attempt}/{max_retries})")

            # Exponential backoff
            if attempt < max_retries:
                sleep_time = base_delay * (2 ** (attempt - 1))
                time.sleep(sleep_time)
                continue

            logger.error(f"All retries exhausted. Last error: {e}")
            return {"error": "External AI service unreachable. Please try again."}

        except ValueError as e:
            # JSON parsing or response format issue — DO NOT RETRY
            logger.error(f"Bad AI response format: {e}")
            return {"error": f"Invalid AI response format: {e}"}

        except Exception as e:
            logger.exception(f"Unexpected AI error: {e}")
            return {"error": "Unexpected AI service failure."}

    # Safety fallback
    return {"error": "Unknown error communicating with AI service."}
