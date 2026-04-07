import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes protégées par authentification
router.use(authenticateToken);

// Obtenir les messages pour une tâche spécifique
router.get('/', async (req: any, res) => {
  try {
    const { task_id } = req.query;
    const userId = req.user.id;

    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: 'task_id est requis'
      });
    }

    const messages = await req.db?.query(`
      SELECT m.*, u.username 
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.task_id = $1 AND m.is_public = TRUE
      ORDER BY m.created_at ASC
    `, [task_id]);

    res.json({
      success: true,
      messages: messages?.rows || []
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Créer un nouveau message
router.post('/', async (req: any, res) => {
  try {
    const { task_id, user_id, content, mentioned_user_id, mentioned_user_name, is_public } = req.body;
    const currentUserId = req.user.id;

    // Validation
    if (!task_id || !content || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'task_id, content et user_id sont requis'
      });
    }

    // Vérifier que l'utilisateur peut bien créer ce message
    if (user_id !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const result = await req.db?.query(`
      INSERT INTO messages (task_id, user_id, content, mentioned_user_id, mentioned_user_name, is_public, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [task_id, user_id, content, mentioned_user_id, mentioned_user_name, is_public !== false]);

    // Créer une notification si une mention est faite
    if (mentioned_user_id && mentioned_user_id !== currentUserId) {
      await req.db?.query(`
        INSERT INTO notifications (user_id, type, title, message, created_at, updated_at)
        VALUES ($1, 'mention', 'Nouvelle mention', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [mentioned_user_id, `Vous avez été mentionné dans un commentaire: ${content.substring(0, 50)}...`]);
    }

    res.json({
      success: true,
      message: result?.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;
