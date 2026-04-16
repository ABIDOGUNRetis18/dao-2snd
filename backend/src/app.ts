// Charger les variables d'environnement AVANT les imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './utils/database';

// Importer les routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import daoRoutes from './routes/dao';
import taskRoutes from './routes/tasks';
import myTasksRoutes from './routes/myTasks';
import taskProgressRoutes from './routes/taskProgress';
import notificationsRoutes from './routes/notifications';
import messagesRoutes from './routes/messages';
import teamRoutes from './routes/team';
import taskAssignmentRoutes from './routes/taskAssignment';
import taskModelRoutes from './routes/taskModels';

const app = express();
const PORT = process.env.PORT || 3001;

// Sécurité avec Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuré pour la production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL_PROD?.split(',') || []
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dao', daoRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/my-tasks', myTasksRoutes);
app.use('/api/task-progress', taskProgressRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/task-assignment', taskAssignmentRoutes);
app.use('/api/task', taskModelRoutes);

// Route de test
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend DAO 2SND fonctionne correctement!',
    timestamp: new Date().toISOString()
  });
});

// Middleware 404 - doit être après toutes les autres routes
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion des erreurs globales
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur interne'
  });
});

// Démarrer le serveur
async function startServer() {
  try {
    // Initialiser la base de données
    await initializeDatabase();
    console.log('Base de données initialisée avec succès');

    app.listen(PORT, () => {
      console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
      console.log(`📊 API disponible: http://localhost:${PORT}/api`);
      console.log(`🔐 Authentification: http://localhost:${PORT}/api/auth`);
      console.log(`🧪 Route de test: http://localhost:${PORT}/api/test`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();
