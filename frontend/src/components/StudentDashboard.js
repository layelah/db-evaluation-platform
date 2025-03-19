import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Button, Box, Input } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function StudentDashboard({ user, onLogout }) {
  const [exercises, setExercises] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    try {
      const [exercisesRes, submissionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/exercises'),
        axios.get('http://localhost:5000/api/submissions'),
      ]);
      setExercises(exercisesRes.data);
      setSubmissions(submissionsRes.data.filter(sub => sub.student_id === user.id));
      setAllSubmissions(submissionsRes.data);
    } catch (error) {
      setMessage('Erreur lors du chargement des données');
      console.error(error);
    }
  };

  const handleSubmit = async (exerciseId) => {
    if (!file) {
      setMessage('Veuillez sélectionner un fichier PDF');
      return;
    }
    setLoading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('student_id', user.id);
    formData.append('exercise_id', exerciseId);
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Soumission envoyée avec succès !');
      setFile(null);
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur lors de la soumission');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: submissions.map(sub => new Date(sub.submitted_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Mes notes',
        data: submissions.map(sub => sub.grade),
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
      {
        label: 'Moyenne de la classe',
        data: submissions.map(() => allSubmissions.length > 0
          ? allSubmissions.reduce((sum, sub) => sum + sub.grade, 0) / allSubmissions.length
          : 0),
        fill: false,
        borderColor: 'rgba(255, 99, 132, 1)',
        borderDash: [5, 5],
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Évolution de mes performances' },
    },
    scales: { y: { beginAtZero: true, max: 20 } },
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenue, {user.email} (Étudiant)
      </Typography>
      <Button variant="contained" onClick={onLogout} sx={{ mb: 2 }}>
        Déconnexion
      </Button>
      {message && (
        <Typography color={message.includes('Erreur') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Typography>
      )}

      <Typography variant="h5" gutterBottom>Suivi des performances</Typography>
      {submissions.length > 0 ? (
        <Box sx={{ mb: 4 }}>
          <Line data={chartData} options={chartOptions} />
          <Typography sx={{ mt: 2 }}>
            <strong>Moyenne personnelle :</strong> {(submissions.reduce((sum, sub) => sum + sub.grade, 0) / submissions.length || 0).toFixed(2)}/20
          </Typography>
          <Typography>
            <strong>Moyenne de la classe :</strong> {(allSubmissions.length > 0 ? allSubmissions.reduce((sum, sub) => sum + sub.grade, 0) / allSubmissions.length : 0).toFixed(2)}/20
          </Typography>
        </Box>
      ) : (
        <Typography>Aucune soumission pour l’instant.</Typography>
      )}

      <Typography variant="h5" gutterBottom>Exercices disponibles</Typography>
      {exercises.map(exercise => (
        <Box key={exercise.id} sx={{ border: '1px solid #ccc', p: 2, mb: 2 }}>
          <Typography variant="h6">{exercise.title}</Typography>
          <Typography>{exercise.content}</Typography>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            sx={{ width: '70%', mr: 2 }}
            disabled={loading}
          />
          <Button onClick={() => handleSubmit(exercise.id)} variant="contained" disabled={loading}>
            {loading ? 'Envoi...' : 'Soumettre'}
          </Button>
        </Box>
      ))}

      <Typography variant="h5" gutterBottom>Vos soumissions</Typography>
      {submissions.map(sub => (
        <Box key={sub.id} sx={{ border: '1px solid #ccc', p: 2, mb: 2 }}>
          <Typography><strong>Exercice :</strong> {sub.exercise_title}</Typography>
          <Typography><strong>Fichier :</strong> {sub.file_path}</Typography>
          <Typography><strong>Note :</strong> {sub.grade}/20</Typography>
          <Typography><strong>Feedback :</strong> {sub.feedback}</Typography>
          <Typography><strong>Date :</strong> {new Date(sub.submitted_at).toLocaleString()}</Typography>
        </Box>
      ))}
    </Container>
  );
}

export default StudentDashboard;