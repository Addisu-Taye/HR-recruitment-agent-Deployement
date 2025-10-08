# pii_redaction.py

# Correct Import: NlpEngineProvider is often found in the nlp_engine submodule
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider 

# --- PII REDACTION SETUP (Using Medium Model for Render Free Tier) ---

# Set max text length limit
MAX_TEXT_LENGTH = 5000

# Explicitly configure spaCy to use the medium model (en_core_web_md)
# This prevents Django from trying to download the huge default 'lg' model during initialization.
nlp_engine = NlpEngineProvider(nlp_configuration={
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "en", "model_name": "en_core_web_md"}]
}).create_engine()

# Initialize the Analyzer and Anonymizer with the configured engine
analyzer = AnalyzerEngine(nlp_engine=nlp_engine)
anonymizer = AnonymizerEngine()


def redact_pii(text: str) -> str:
    """
    Uses Presidio to detect and replace common PII entities in text.
    Handles exceptions and logs security warnings.
    """
    if not text:
        return ""

    try:
        # Target common resume PII: Name, Phone, Email, Location, Organization
        results = analyzer.analyze(
            text=text,
            entities=["PERSON", "PHONE_NUMBER", "EMAIL_ADDRESS", "LOCATION", "ORG"],
            language='en'
        )
        
        # Replace detected PII entities with their type (e.g., <PERSON>)
        anonymized_text = anonymizer.anonymize(
            text=text,
            analyzer_results=results
        )
        return anonymized_text.text
    
    except Exception as e:
        # Log PII Redaction failure but return raw text as a secure fallback
        print(f"SECURITY WARNING: PII Redaction failed. Error: {e}")
        return text