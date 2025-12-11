require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Inicializar Firebase Admin (sin storageBucket porque no lo usaremos)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const fileRoutes = require('./routes/fileRoutes');
app.use('/api/files', fileRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend PruebaDyD funcionando',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Error interno del servidor',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend ejecutándose en: http://localhost:${PORT}`);
  console.log(`📁 Rutas disponibles:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/files/upload`);
  console.log(`   GET  /api/files/list`);
});
