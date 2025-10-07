import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from './Card';
import MetricCard from './MetricCard';

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [jobsError, setJobsError] = useState(null);
  const [candidatesError, setCandidatesError] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);

  // --- Fix 1: Safely extract 'jobs' array from response object ---
  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8084/api/jobs/');
      // FIX: Assuming Django returns { message: "...", jobs: [...] }
      const jobArray = response.data.jobs || []; 
      setJobs(jobArray);
      setJobsError(null);
    } catch (error) {
      console.error("Jobs API Error:", error);
      setJobsError("Failed to load job listings");
      setJobs([]);
    }
  };

  // --- Fix 2: Safely extract 'candidates' array from response object ---
  const fetchCandidates = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8084/api/candidates/');
      // FIX: Assuming Django returns { message: "...", candidates: [...] }
      // Filter is now applied to the nested array, with a safety check
      const candidateArray = response.data.candidates || []; 
      setCandidates(candidateArray.filter(c => c.shortlisted));
      setCandidatesError(null);
    } catch (error) {
      console.error("Candidates API Error:", error);
      setCandidatesError("Failed to load candidates");
      setCandidates([]);
    }
  };

  // --- Fix 3: Safely extract analytics data (if nested) ---
  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8084/api/analytics/');
      // FIX: Assuming Django returns a top-level object or { message: "...", stats: {...} }
      // We assume the analytics data is the top-level object for simplicity, 
      // but ensure we handle potential nesting like {stats: {...}} if necessary.
      setAnalytics(response.data);
      setAnalyticsError(null);
    } catch (error) {
      console.error("Analytics API Error:", error);
      setAnalyticsError("Failed to load analytics");
      setAnalytics(null);
    }
  };

  // Main effect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Use await to wait for the promises to settle before setting loading to false
      await Promise.allSettled([fetchJobs(), fetchCandidates(), fetchAnalytics()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* --- Analytics Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Note: The rendering logic for analytics is already safe using optional chaining (?.) */}
        <MetricCard title="Total Applications" value={analyticsError ? 'Error' : analytics?.total_candidates ?? 0} />
        <MetricCard
          title="Shortlisted"
          value={analyticsError ? 'Error' : analytics?.shortlisted ?? 0}
          className="text-green-600"
        />
        <MetricCard
          title="Avg Match Score"
          value={analyticsError ? 'Error' : `${analytics?.avg_score?.toFixed?.(1) ?? 0}%`}
          className="text-blue-600"
        />
        <MetricCard
          title="Active Jobs"
          value={jobsError ? 'Error' : jobs.length}
          className="text-purple-600"
        />
      </div>

      {/* --- Jobs Section --- */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Active Job Postings</h2>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {jobsError ? 'Error' : `${jobs.length} positions`}
          </span>
        </div>

        {jobsError ? (
          <div className="text-center py-12 text-red-600">
            <p className="font-medium">{jobsError}</p>
            <button onClick={fetchJobs} className="btn-primary mt-4">Retry</button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="font-medium">No jobs available.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* FIX: The rendering logic is now safe because 'jobs' is guaranteed to be an array here */}
            {jobs.map(job => (
              <Card key={job.id}>
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{job.title}</h3>
                    <p className="text-blue-600 font-medium">{job.department}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Active</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-3 line-clamp-2">{job.description}</p>
                <div className="mt-4">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">Requirements:</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">{job.requirements}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* --- Candidates Section --- */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Shortlisted Candidates</h2>

        {candidatesError ? (
          <div className="text-center py-8 text-red-600">
            <p className="font-medium">{candidatesError}</p>
            <button onClick={fetchCandidates} className="btn-primary mt-4">Retry</button>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="font-medium">No candidates shortlisted yet</p>
            <p className="mt-1 text-sm">Candidates will appear once they meet the 70% match threshold.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map(candidate => (
              <Card key={candidate.id} className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{candidate.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{candidate.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Applied for: {candidate.job__title}</p>
                </div>
                <div className="text-right">
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                    {candidate.match_score ? `${candidate.match_score.toFixed(1)}% Match` : 'N/A'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {/* FIX: Use optional chaining to safely access and slice skills array */}
                    {Array.isArray(candidate.skills) ? candidate.skills.slice(0, 3).join(', ') : 'N/A'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}