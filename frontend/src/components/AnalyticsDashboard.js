import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Container, Typography, Button, Box } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AnalyticsDashboard({ user, onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/submissions');
      setSubmissions(response.data);
    } catch (error) {
      setMessage('Erreur lors du chargement des données');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données pour le graphique
  const studentStats = submissions.reduce((acc, sub) => {
    if (!acc[sub.student_email]) {
      acc[sub.student_email] = { grades: [], exercises: [] };
    }
    acc[sub.student_email].grades.push(sub.grade);
    acc[sub.student_email].exercises.push(sub.exercise_title);
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(studentStats),
    datasets: [
      {
        label: 'Note moyenne',
        data: Object.values(studentStats).map(stats => 
          stats.grades.reduce((sum, grade) => sum + grade, 0) / stats.grades.length || 0
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Performance moyenne des étudiants' },
    },
    scales: {
      y: { beginAtZero: true, max: 20 },
    },
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord analytique (Professeur)
      </Typography>
      <Button variant="contained" onClick={onBack} disabled={loading} sx={{ mb: 2 }}>
        {loading ? 'Chargement...' : 'Retour au dashboard'}
      </Button>
      {message && (
        <Typography color={message.includes('Erreur') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Typography>
      )}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Statistiques des performances</Typography>
        {submissions.length > 0 ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <Typography>Aucune soumission pour l’instant.</Typography>
        )}
      </Box>
      <Box>
        <Typography variant="h6">Détails par étudiant</Typography>
        {Object.entries(studentStats).map(([email, stats]) => (
          <Box key={email} sx={{ border: '1px solid #ccc', p: 2, mb: 2 }}>
            <Typography><strong>Étudiant :</strong> {email}</Typography>
            <Typography><strong>Note moyenne :</strong> {(stats.grades.reduce((sum, g) => sum + g, 0) / stats.grades.length).toFixed(2)}/20</Typography>
            <Typography><strong>Exercices soumis :</strong> {stats.exercises.join(', ')}</Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
}

export default AnalyticsDashboard;