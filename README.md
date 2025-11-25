# 🤖 AI-Powered HR Recruitment Agent

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)
![Django](https://img.shields.io/badge/Backend-Django%204.2-blueviolet.svg)
![React](https://img.shields.io/badge/Frontend-React%2018-orange.svg)
![Render](https://img.shields.io/badge/Deployed%20On-Render-success.svg)

An end-to-end **AI-powered HR recruitment system** that automates the entire hiring process — from job posting and intelligent resume screening to candidate ranking and interview scheduling — using 100% free and open-source models.

---

## 🌍 Deployment Targets
- **Hugging Face Spaces** (for demo or light CPU hosting)
- **Render** (for scalable full-stack deployment)

---

## 🌟 Features

### 📋 Job Management
- Create, update, and publish job listings via Django Admin  
- REST API for job data consumption  
- Department and requirement categorization  

### 🤖 AI-Powered Resume Screening
- **Skill Extraction:** Automatically identifies relevant skills from resumes  
- **Experience Analysis:** Extracts years of experience and education  
- **Intelligent Matching:** Compares candidates against job requirements using semantic similarity  
- **PII Redaction:** Automatically detects and redacts sensitive information (SSN, phone numbers, bank accounts)  

### 📊 Candidate Intelligence
- **Match Scoring:** Provides percentage-based compatibility scores  
- **Strength Analysis:** Highlights candidate strengths  
- **Gap Identification:** Identifies missing critical skills  
- **Auto Shortlisting:** Automatically shortlists candidates above 70% match threshold  

### 🖥️ Professional Dashboard
- Real-time analytics and metrics  
- Job-wise application tracking  
- Candidate ranking visualization  
- Responsive React frontend with Tailwind CSS  

### 📧 Automated Workflows
- Email notifications for shortlisted candidates (SendGrid integration)  
- Interview scheduling coordination  
- Background task processing with Django-Q  

---

## 🧩 Agent Roles and LangGraph Workflow

_The diagram below is visible when viewed on GitHub._

```mermaid
graph TD
    A(JobScraperAgent) --> B(CandidateMatcherAgent)
    B --> C(InterviewSchedulerAgent)
    C --> D(FeedbackCollectorAgent)
    D --> E(Human Reviewer)
    E -->|Approval/Feedback| B
    style A fill:#b3e5fc,stroke:#0288d1,stroke-width:2px
    style B fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style C fill:#fff9c4,stroke:#fbc02d,stroke-width:2px
    style D fill:#ffe0b2,stroke:#ef6c00,stroke-width:2px
    style E fill:#f8bbd0,stroke:#ad1457,stroke-width:2px
```

### Agent Role Definitions
- **JobScraperAgent:** Collects job postings from LinkedIn, Indeed, or internal APIs.  
- **CandidateMatcherAgent:** Performs semantic matching and ranking based on skills and experience.  
- **InterviewSchedulerAgent:** Automates interview scheduling and sends notifications.  
- **FeedbackCollectorAgent:** Gathers interviewer feedback and updates candidate status.  
- **Human Reviewer:** Provides final validation (Human-in-the-Loop).  

---

## 🛠️ Technology Stack

### Backend
- **Framework:** Django 4.2 + Django REST Framework  
- **AI Orchestration:** LangGraph for stateful workflows  
- **Database:** SQLite (demo) / PostgreSQL (production)  
- **Task Queue:** Django-Q for background processing  

### AI Models (All CPU-Optimized & Free)
- Resume Parsing → `dslim/bert-base-NER`  
- Semantic Matching → `sentence-transformers/all-MiniLM-L6-v2`  
- Insight Generation → `google/flan-t5-small`  
- PII Detection → Custom regex + Presidio integration  

### Frontend
- **Framework:** React 18 + Vite  
- **Styling:** Tailwind CSS + Inter font  
- **Charts:** Chart.js for analytics visualization  
- **HTTP Client:** Axios  

### Deployment
- **Demo:** Hugging Face Spaces (Free Tier)  
- **Production:** Render (Web Service + PostgreSQL + Static CDN)  
- **Containerization:** Docker  

---

## 🚀 Quick Start

### Local Development

```bash
# Clone repo
git clone https://github.com/your-username/hr-recruitment-agent.git
cd hr-recruitment-agent

# Backend Setup
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows
pip install -r requirements.txt
python backend/manage.py migrate
python backend/manage.py createsuperuser
python backend/manage.py collectstatic --noinput
python backend/manage.py runserver 8084

# Frontend Setup
cd frontend
npm install
npm start
```

Access the application:  
- **Frontend:** http://localhost:3000  
- **Admin:** http://localhost:8084/admin  
- **API:** http://localhost:8084/api/jobs/

---

## ☁️ Deployment Options

### A. Hugging Face Spaces (Lightweight Demo)

```bash
# Build React frontend
cd frontend
npm run build

# Configure your Space:
# SDK: Docker
# Hardware: CPU Basic
# Secrets:
#   SECRET_KEY=your-django-secret-key
#   DEBUG=False
```

App will deploy at:  
`https://<YOUR_HF_USERNAME>-hr-recruitment-agent.hf.space`

---

### B. Render Full-Stack Deployment (Recommended)

Render simplifies deployment for **React (Frontend)** + **Django (Backend)** + **AI Service (Hugging Face or FastAPI)**.

#### 🏗️ Architecture Overview

| Component | Render Type | Role | Key Features |
|------------|-------------|------|---------------|
| Frontend | Static Site | React interface | CDN-backed, global distribution |
| Backend | Web Service | Django + PII Redaction | Auto-scaling, Gunicorn server |
| Database | PostgreSQL | Persistent storage | Internal networking |
| AI Component | Web Service | AI resume screening | Decoupled compute scaling |

---

### 🔐 PII Redaction Workflow

_The diagram below is visible when viewed on GitHub._

```mermaid
graph TD
    A[Browser] -->|Public URL| B(React Frontend)
    B -->|API Calls| C(Django Backend)
    C -->|PII Redaction| C_Redact(Redacted Data)
    C_Redact -->|Secure Link| D(PostgreSQL DB)
    C_Redact -->|Internal Network| E(AI Service)
    E -->|Scored Result| C
    C --> F(Render Metrics)
```

---

## 🧩 CI/CD with Render (Blueprints)

Define infrastructure in `render.yaml`:

```yaml
services:
  - type: web
    name: hr-recruitment-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python backend/manage.py collectstatic --noinput && python backend/manage.py migrate && gunicorn hr_core.wsgi:application"
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: "False"
      - key: HF_SPACE_API_URL
        value: "YOUR_GRADIO_SPACE_API_URL"

  - type: static
    name: hr-recruitment-frontend
    rootDir: frontend
    buildCommand: "npm install && npm run build"
    publishPath: build
    envVars:
      - key: REACT_APP_BACKEND_URL
        value: "https://hr-recruitment-backend.onrender.com"
```

**Deployment Flow:**  
`Git Push → Render Blueprint → Build → Auto Deploy → Zero-Downtime`

---

## 🧪 Testing Strategy

### Pre-Deployment
| Test | Objective | Tool |
|------|------------|------|
| Blueprint Validation | Validate `render.yaml` syntax | Render Dashboard |
| CORS Check | Verify origin whitelisting | Django settings |
| PII Redaction | Ensure masking works pre-upload | Django Shell |

### Post-Deployment
- ✅ DB Connection Test via Django Admin  
- 🤖 AI Integration Test via Internal Network  
- 🌍 End-to-End Test (Frontend → Backend → Redaction → DB/AI)  
- 📊 Performance Monitor via Render Metrics  

---

# 🛠️ Troubleshooting & Maintenance

This section covers common issues, fixes, and long-term maintenance routines to ensure smooth operation of the AI-powered HR Recruitment Agent.

---

## ❗ Common Issues & Fixes

### 1. Backend Not Responding (500 or 502 on Render)
- Frontend shows **"Server Error"**
- API endpoints return **500**
- Render logs show migration or import errors

**Fixes**
- Run database migrations:
  ```bash
  python backend/manage.py migrate
  ```
- Verify required environment variables:
  - `SECRET_KEY`
  - `DEBUG=False`
  - `HF_SPACE_API_URL`
- Add Render domain to `ALLOWED_HOSTS`

---

### 2. AI Screening Not Working (Timeouts or Empty Response)
- Resume screening stalls or exceeds 30 seconds  
- Hugging Face Space API returns empty results  
- Backend logs show timeout exceptions  

**Fixes**
- Restart Hugging Face Space  
- Add retry logic in API call  
- Increase Django timeout to 45 seconds if needed  

---

### 3. CORS Errors From React Frontend
Browser displays:  
```
No 'Access-Control-Allow-Origin' header
```

**Fixes**  
Add this to Django:
```python
CORS_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://your-frontend.onrender.com"
]
```

---

### 4. Static Files Not Loading in Production (404)

**Fixes**
- Run:
  ```bash
  python backend/manage.py collectstatic --noinput
  ```
- Ensure:
  ```python
  STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
  ```

---

### 5. SQLite Showing “Database Locked”

**Symptoms**
- Admin freezes  
- AI scoring fails intermittently  

**Fix**  
Switch to PostgreSQL on Render.

---

### 6. Resume Parsing Extracts Wrong or Missing Skills

**Fixes**
- Confirm the correct Hugging Face NER model  
- Improve parsing using `presidio-analyzer`  
- Validate extracted raw text before screening  

---

### 7. Django-Q Tasks Not Executing
- Emails not sent  
- Interview scheduling failing  

**Fixes**
Run worker manually:
```bash
python manage.py qcluster
```

Or configure a Render Worker Service.

---

# 🔧 System Maintenance

## Weekly Maintenance Checklist
- Clear old job logs via Django Admin  
- Review Render logs for failing API calls  
- Restart Hugging Face Space to clear memory  
- Test PII redaction via Django shell  
- Verify AI accuracy on sample resumes  

---

# 🔒 Database Backups

### PostgreSQL Backup Command
```bash
pg_dump --format=c --file=backup.dump $DATABASE_URL
```

**Recommended**
- Enable daily automated backups on Render  
- Store weekly backups offsite (AWS S3, GDrive)  

---

# 🚀 Safe AI Model Upgrades

**Steps**
1. Deploy new model to staging HF Space  
2. Test on 5–10 real sample resumes  
3. Validate inference speed (< 2s per request)  
4. Update production HF API URL only after approval  

---

# 📈 Scaling Recommendations (Render)
- Increase backend plan (Starter → Standard)  
- Add separate Worker Dyno for Django-Q  
- Enable Render autoscaling  
- Use PostgreSQL instead of SQLite  

---

# 📊 Monitoring & Alerts

**Recommended Tools**
- Render Metrics → CPU, RAM, response time  
- HF Spaces Logs → AI failures, restarts  
- PostgreSQL dashboard → table sizes, slow queries  
- Browser DevTools → CORS & API failures  

---

# 🧹 Removing Old Candidate Data

```bash
python manage.py clearsessions
python manage.py purge_old_candidates
```

(Optional: run as a cron job in Render Worker)

---

# 💡 Stability Tips
- Always keep `DEBUG=False` in production  
- Store only redacted resume text (never raw files)  
- Restart HF Space monthly to free memory  
- Log all AI errors for debugging  
- Avoid storing large PDF/blob data in the DB  



## 📜 License

**MIT License © 2025 Addisu Taye Dadi**

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🧭 Summary

**Security:** Django acts as the PII gateway, ensuring redacted data only reaches AI.  
**Scalability:** Render supports zero-downtime deployment with modular scaling.  
**Transparency:** Open-source MIT license with clear modular design.  
**Goal:** Ethical, automated, and human-supervised recruitment AI system.  

> © 2025 Addisu Taye Dadi — Full-Stack AI-Powered Recruitment System
