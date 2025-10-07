import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ApplicationForm from './components/ApplicationForm';
import ThemeToggle from './components/ThemeToggle'; // 🌗 Add this line
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      {/* Header */}
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' ? <Dashboard /> : <ApplicationForm />}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-950 text-white py-6 mt-12 transition-colors duration-500">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 dark:text-gray-500">© 2025 ABCD Bank S.C. All rights reserved.</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            World's Leading Commercial Bank
          </p>
        </div>
      </footer>

      {/* 🌗 Floating Theme Toggle Button */}
      <ThemeToggle />
    </div>
  );
}

export default App;
