import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import SubmissionsView from './components/SubmissionsView';
import AnalyticsDashboard from './components/AnalyticsDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'submissions', ou 'analytics'

  const handleLogin = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  return (
    <div className="App">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : user.role === 'student' ? (
        <StudentDashboard user={user} onLogout={handleLogout} />
      ) : view === 'dashboard' ? (
        <TeacherDashboard
          user={user}
          onLogout={handleLogout}
          onViewSubmissions={() => handleViewChange('submissions')}
          onViewAnalytics={() => handleViewChange('analytics')}
        />
      ) : view === 'submissions' ? (
        <SubmissionsView user={user} onBack={() => handleViewChange('dashboard')} />
      ) : (
        <AnalyticsDashboard user={user} onBack={() => handleViewChange('dashboard')} />
      )}
    </div>
  );
}

export default App;