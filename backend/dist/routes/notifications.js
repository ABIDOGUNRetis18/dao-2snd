"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Routes protégées par authentification
router.use(auth_1.authenticateToken);
// Obtenir les notifications de l'utilisateur connecté
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { checkDeposits } = req.query;
        // TODO: Implémenter la logique de vérification des dépôts si checkDeposits=true
        const notifications = await req.db?.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
        res.json({
            success: true,
            notifications: notifications?.rows || []
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// Marquer une notification comme lue
router.put('/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        await req.db?.query(`
      UPDATE notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
    `, [notificationId, userId]);
        res.json({
            success: true,
            message: 'Notification marquée comme lue'
        });
    }
    catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map