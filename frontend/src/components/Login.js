import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography, TextField, Button, MenuItem, FormControl, Select, Box } from '@mui/material';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/login', { email, password });
      onLogin(response.data);
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la connexion');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/users', { email, password, role });
      onLogin(response.data);
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de l’inscription');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        {isRegistering ? 'Inscription' : 'Connexion'}
      </Typography>
      <form onSubmit={isRegistering ? handleRegister : handleLogin}>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        {isRegistering && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="student">Étudiant</MenuItem>
              <MenuItem value="teacher">Professeur</MenuItem>
            </Select>
          </FormControl>
        )}
        <Button type="submit" variant="contained" fullWidth sx={{ mb: 2 }}>
          {isRegistering ? 'S’inscrire' : 'Se connecter'}
        </Button>
      </form>
      <Box sx={{ mt: 2 }}>
        <Typography>
          {isRegistering ? 'Déjà un compte ?' : 'Pas de compte ?'}
          <Button onClick={() => setIsRegistering(!isRegistering)} color="primary">
            {isRegistering ? 'Se connecter' : 'S’inscrire'}
          </Button>
        </Typography>
      </Box>
    </Container>
  );
}

export default Login;