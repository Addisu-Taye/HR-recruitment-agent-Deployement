// src/components/Card.jsx
import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div
      className={`card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-soft ${className}`}
    >
      {children}
    </div>
  );
}
