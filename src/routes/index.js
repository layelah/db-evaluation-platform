const express = require('express');
const router = express.Router();
const db = require('../config/db');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');

// Configuration de multer pour stocker les fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Inscription
router.post('/users', (req, res) => {
  const { email, password, role } = req.body;
  const query = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)';
  db.query(query, [email, password, role], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, email, role });
  });
});

// Connexion
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    const user = results[0];
    res.json({ id: user.id, email: user.email, role: user.role });
  });
});

// Création d'exercice
router.post('/exercises', (req, res) => {
  const { teacher_id, title, content, correction } = req.body;
  const query = 'INSERT INTO exercises (teacher_id, title, content, correction) VALUES (?, ?, ?, ?)';
  db.query(query, [teacher_id, title, content, correction], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, teacher_id, title, content, correction });
  });
});

// Liste des exercices
router.get('/exercises', (req, res) => {
  const query = 'SELECT * FROM exercises';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Soumission avec upload de fichier
router.post('/submissions', upload.single('file'), async (req, res) => {
  const { student_id, exercise_id } = req.body;
  const file = req.file;

  if (!student_id || !exercise_id || !file) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  // Récupérer la correction de l'exercice
  const exerciseQuery = 'SELECT correction FROM exercises WHERE id = ?';
  db.query(exerciseQuery, [exercise_id], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Exercice non trouvé' });

    const correction = results[0].correction || '';

    // Extraire le texte du PDF
    const filePath = path.join(__dirname, '../../uploads', file.filename);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    const studentAnswer = pdfData.text;

    // Évaluation par l’IA
try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',
      prompt: `Évalue cette réponse d’étudiant : "${studentAnswer}" par rapport à la correction : "${correction}". Fournis une note sur 20 et un feedback détaillé en français uniquement, au format suivant : "Note : X/20\nFeedback : [détails en français]".`,
      stream: false,
    });
  
    const iaResponse = response.data.response;
    const gradeMatch = iaResponse.match(/Note\s*:\s*(\d+)\/20/);
    const feedbackMatch = iaResponse.match(/Feedback\s*:\s*(.+)/);
  
    const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 0;
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Aucun feedback fourni';
  
    // Insérer la soumission
    const query = 'INSERT INTO submissions (student_id, exercise_id, file_path, grade, feedback) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [student_id, exercise_id, file.filename, grade, feedback], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, student_id, exercise_id, file_path: file.filename, grade, feedback });
    });
  } catch (error) {
    console.error('Erreur avec Ollama :', error);
    res.status(500).json({ error: 'Erreur lors de la correction automatique' });
  }
  });
});

// Liste des soumissions
router.get('/submissions', (req, res) => {
  const query = `
    SELECT 
      s.id, s.student_id, s.exercise_id, s.file_path, s.grade, s.feedback, s.submitted_at,
      u.email AS student_email, e.title AS exercise_title
    FROM submissions s
    JOIN users u ON s.student_id = u.id
    JOIN exercises e ON s.exercise_id = e.id
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Mise à jour d’une soumission
router.put('/submissions/:id', (req, res) => {
  const { id } = req.params;
  const { grade, feedback } = req.body;
  if (grade === undefined || !feedback) {
    return res.status(400).json({ error: 'Note et feedback requis' });
  }
  const query = 'UPDATE submissions SET grade = ?, feedback = ? WHERE id = ?';
  db.query(query, [grade, feedback, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Soumission non trouvée' });
    res.json({ message: 'Soumission mise à jour' });
  });
});

module.exports = router;