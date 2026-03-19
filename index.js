require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();

// 🔗 Connexion MongoDB
connectDB();

// 🔓 Autoriser les requêtes (CORS)
app.use(cors());

// 📦 Parser JSON
app.use(express.json());

// 🔐 Routes AUTH
app.use('/api/auth', authRoutes);

// 🧪 Route test
app.get('/', (req, res) => {
  res.json({ message: "Backend opérationnel ✔️" });
});

// 🚀 Lancer serveur
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

