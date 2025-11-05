import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from './Card';
import MetricCard from './MetricCard';

export default function ApplicationForm() {
  const [resumeFile, setResumeFile] = useState(null);
  const [selectedJob, setSelectedJob] = useState('');
  const [jobs, setJobs] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  
  // New state for applicant info
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');

  useEffect(() => {
    axios.get('http://localhost:8084/api/jobs/')
      .then(res => {
        const jobList = res.data.jobs || []; 
        setJobs(jobList);
      })
      .catch(err => {
        console.error('Failed to load jobs:', err);
        setError('Failed to load job listings. Please ensure the backend is running.');
        setJobs([]); 
      });
  }, []);


  const handleFileChange = e => {
  const file = e.target.files[0];
  if (file) {
    //const validTypes = ['application/pdf', 'text/plain', 'application/msword'];
    const validExtensions = ['.pdf', '.txt', '.doc', '.docx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Please upload PDF, TXT, DOC, or DOCX files only');
      setResumeFile(null);
      setFileName('');
      return;
    }
    
    setResumeFile(file);
    setFileName(file.name);
  }
};

  const handleSubmit = async e => {
    e.preventDefault();
    if (!resumeFile || !selectedJob || !applicantName || !applicantEmail) {
      setError('Please fill in all fields and upload a resume');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicantEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('job_id', selectedJob);
    formData.append('name', applicantName);      // Use real name
    formData.append('email', applicantEmail);    // Use real email

    try {
      const res = await axios.post('http://localhost:8084/api/process-application/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      console.error('Application failed:', err);
      setError('Application processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Join ABCD Bank</h2>
        <p className="text-gray-600 dark:text-gray-300">Apply for open positions and start your banking career</p>
      </div>

      <Card>
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Applicant Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label text-gray-900 dark:text-gray-100">Full Name</label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="form-input w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label className="form-label text-gray-900 dark:text-gray-100">Email Address</label>
              <input
                type="email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                className="form-input w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          {/* Job Selection */}
          <div>
            <label className="form-label text-gray-900 dark:text-gray-100">Available Positions</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="form-input w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
              required
            >
              <option value="" className="text-gray-500 dark:text-gray-400">
                Select a position to apply for
              </option>
              {jobs.map((job) => (
                <option
                  key={job.id}
                  value={job.id}
                  className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                >
                  {job.title} • {job.department} • {job.requirements.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="form-label">Upload Resume</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-400 dark:hover:border-primary-400 transition">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
                required
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-1">{fileName || 'Click to upload your resume'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">PDF, DOC, DOCX, or TXT (Max 5MB)</p>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Application...
              </>
            ) : 'Submit Application'}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6">Application Results</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard title="Match Score" value={`${result.match_score.toFixed(1)}%`} />
              <MetricCard
                title="Status"
                value={result.shortlisted ? 'Shortlisted' : 'Not Selected'}
                className={result.shortlisted ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
              />
              <MetricCard
                title="Next Steps"
                value={result.shortlisted ? 'Interview Scheduled' : 'Review Feedback'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3">Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  {result.strengths.map((skill, i) => (
                    <span key={i} className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 px-3 py-1 rounded-full text-sm">{skill}</span>
                  ))}
                </div>
              </Card>

              <Card>
                <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3">
                  {result.missing_skills.length > 0 ? 'Recommended Skills' : 'Perfect Match!'}
                </h4>
                {result.missing_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills.map((skill, i) => (
                      <span key={i} className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 px-3 py-1 rounded-full text-sm">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600 dark:text-green-400">Your profile matches all requirements!</p>
                )}
              </Card>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}