// src/components/MetricCard.jsx
import React from 'react';

export default function MetricCard({ title, value, className = '' }) {
  return (
    <div
      className={`metric-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-soft ${className}`}
    >
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </div>
  );
}
