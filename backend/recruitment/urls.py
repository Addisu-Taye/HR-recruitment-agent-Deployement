# backend/recruitment/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/process-application/', views.process_application),
    path('api/jobs/', views.job_listings),          # ← Must match function name
    path('api/analytics/', views.analytics_data),
    path('api/candidates/', views.candidate_list),
]