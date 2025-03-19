import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SubmissionsView({ user, onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/submissions');
      setSubmissions(response.data);
    } catch (error) {
      setMessage('Erreur lors du chargement des soumissions');
      console.error(error);
    }
  };

  const handleUpdate = async (submissionId, newGrade, newFeedback) => {
    setLoading(true); // Active le chargement
    setMessage('');
    try {
      await axios.put(`http://localhost:5000/api/submissions/${submissionId}`, {
        grade: newGrade,
        feedback: newFeedback,
      });
      setMessage('Soumission mise à jour avec succès !');
      fetchSubmissions();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur lors de la mise à jour');
      console.error(error);
    } finally {
      setLoading(false); // Désactive le chargement
    }
  };

  return (
    <div>
      <h1>Gestion des soumissions (Professeur)</h1>
      <button onClick={onBack} disabled={loading}>
        {loading ? 'Chargement...' : 'Retour au dashboard'}
      </button>
      {message && <p style={{ color: message.includes('Erreur') ? 'red' : 'green' }}>{message}</p>}
      <h2>Toutes les soumissions</h2>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {submissions.map(sub => (
          <div key={sub.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <p><strong>Étudiant:</strong> {sub.student_email}</p>
            <p><strong>Exercice:</strong> {sub.exercise_title}</p>
            <p><strong>Réponse:</strong> {sub.file_path}</p>
            <p><strong>Note actuelle:</strong> {sub.grade}/20</p>
            <p><strong>Feedback actuel:</strong> {sub.feedback}</p>
            <input
              type="number"
              min="0"
              max="20"
              defaultValue={sub.grade}
              onBlur={(e) => handleUpdate(sub.id, parseInt(e.target.value), sub.feedback)}
              style={{ width: '50px', marginRight: '10px' }}
              disabled={loading}
            />
            <input
              type="text"
              defaultValue={sub.feedback}
              onBlur={(e) => handleUpdate(sub.id, sub.grade, e.target.value)}
              style={{ width: '70%' }}
              disabled={loading}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubmissionsView;