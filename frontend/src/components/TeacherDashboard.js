import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, TextField, Button, Box } from '@mui/material';

function TeacherDashboard({ user, onLogout, onViewSubmissions, onViewAnalytics }) {
  const [exercises, setExercises] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [correction, setCorrection] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchExercises();
  }, [user.id]);

  const fetchExercises = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/exercises');
      setExercises(response.data.filter(ex => ex.teacher_id === user.id));
    } catch (error) {
      setMessage('Erreur lors du chargement des exercices');
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/exercises', {
        teacher_id: user.id,
        title,
        content,
        correction,
      });
      setMessage('Exercice créé avec succès !');
      setTitle('');
      setContent('');
      setCorrection('');
      fetchExercises();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur lors de la création');
      console.error(error);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenue, {user.email} (Professeur)
      </Typography>
      <Button variant="contained" onClick={onLogout} sx={{ mb: 2 }}>
        Déconnexion
      </Button>
      <Button variant="contained" onClick={onViewSubmissions} sx={{ ml: 2, mb: 2 }}>
        Voir les soumissions
      </Button>
      <Button variant="contained" onClick={onViewAnalytics} sx={{ ml: 2, mb: 2 }}>
        Tableau analytique
      </Button>
      {message && (
        <Typography color={message.includes('Erreur') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Typography>
      )}
      <Typography variant="h5" gutterBottom>Créer un nouvel exercice</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Contenu de l’exercice"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          fullWidth
          multiline
          rows={4}
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Correction (facultatif)"
          value={correction}
          onChange={(e) => setCorrection(e.target.value)}
          fullWidth
          multiline
          rows={4}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" fullWidth>
          Créer
        </Button>
      </form>
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Vos exercices</Typography>
      {exercises.map(exercise => (
        <Box key={exercise.id} sx={{ border: '1px solid #ccc', p: 2, mb: 2 }}>
          <Typography variant="h6">{exercise.title}</Typography>
          <Typography>{exercise.content}</Typography>
          <Typography><strong>Correction :</strong> {exercise.correction || 'Non définie'}</Typography>
        </Box>
      ))}
    </Container>
  );
}

export default TeacherDashboard;