"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDaos = getAllDaos;
exports.getNextDaoNumber = getNextDaoNumber;
exports.getDaoTypes = getDaoTypes;
exports.getDao = getDao;
exports.updateDao = updateDao;
exports.deleteDao = deleteDao;
exports.archiveDao = archiveDao;
exports.getMyDaos = getMyDaos;
exports.getDaoTasks = getDaoTasks;
exports.getDaoAssignableMembers = getDaoAssignableMembers;
exports.createDao = createDao;
const database_1 = require("../utils/database");
async function getAllDaos(req, res) {
    try {
        const result = await (0, database_1.query)(`
      SELECT 
        d.id,
        d.numero,
        d.objet,
        d.date_depot,
        d.reference,
        d.autorite,
        d.chef_id,
        d.chef_projet_nom,
        d.groupement,
        d.statut,
        d.created_at,
        u.email as chef_projet_email
      FROM daos d
      LEFT JOIN users u ON d.chef_id = u.id
      ORDER BY d.created_at DESC
    `);
        res.status(200).json({
            success: true,
            data: {
                daos: result.rows
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des DAO'
        });
    }
}
async function getNextDaoNumber(req, res) {
    try {
        // Récupérer le dernier numéro de DAO
        const result = await (0, database_1.query)('SELECT reference FROM daos ORDER BY id DESC LIMIT 1');
        let nextNumber = 'DAO-2026-001'; // Valeur par défaut
        if (result.rows.length > 0) {
            const lastRef = result.rows[0].reference;
            // Extraire le numéro de la référence (ex: "DAO-2026-001" -> "001")
            const match = lastRef.match(/DAO-2026-(\d+)/);
            if (match) {
                const lastNum = parseInt(match[1]);
                const nextNum = (lastNum + 1).toString().padStart(3, '0');
                nextNumber = `DAO-2026-${nextNum}`;
            }
        }
        res.status(200).json({
            success: true,
            data: {
                nextNumber
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération du numéro DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du numéro DAO'
        });
    }
}
async function getDaoTypes(req, res) {
    try {
        const result = await (0, database_1.query)('SELECT * FROM dao_types ORDER BY libelle');
        res.status(200).json({
            success: true,
            data: {
                types: result.rows
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des types de DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des types de DAO'
        });
    }
}
async function getDao(req, res) {
    try {
        const { id } = req.params;
        const result = await (0, database_1.query)(`
      SELECT 
        d.id,
        d.numero,
        d.objet,
        d.date_depot,
        d.reference,
        d.autorite,
        d.chef_id,
        d.chef_projet_nom,
        d.groupement,
        d.nom_partenaire,
        d.statut,
        d.description,
        d.type_dao,
        d.created_at,
        u.email as chef_projet_email
      FROM daos d
      LEFT JOIN users u ON d.chef_id = u.id
      WHERE d.id = $1
    `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'DAO non trouvé'
            });
        }
        const dao = result.rows[0];
        // Récupérer les membres d'équipe du DAO
        let members = [];
        try {
            const membersResult = await (0, database_1.query)(`
        SELECT 
          dm.user_id,
          u.username,
          u.email,
          u.role_id,
          dm.assigned_at
        FROM dao_members dm
        JOIN users u ON dm.user_id = u.id
        WHERE dm.dao_id = $1
        ORDER BY dm.assigned_at ASC
      `, [id]);
            members = membersResult.rows.map((member) => ({
                id: member.user_id,
                username: member.username,
                email: member.email,
                role_id: member.role_id,
                assigned_at: member.assigned_at
            }));
        }
        catch (error) {
            // Si la table dao_members n'existe pas encore, on continue sans membres
            console.log('Table dao_members non trouvée ou vide pour le DAO:', id);
        }
        res.status(200).json({
            success: true,
            data: {
                dao: { ...dao, membres: members.map((m) => m.id) },
                members: members
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération du DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du DAO'
        });
    }
}
async function updateDao(req, res) {
    try {
        const { id } = req.params;
        const { objet, reference, description, autorite, chef_id, chef_projet_nom, date_depot, groupement, nom_partenaire, type_dao, membres } = req.body;
        const result = await (0, database_1.query)(`UPDATE daos SET 
        objet = $1,
        reference = $2,
        description = $3,
        autorite = $4,
        chef_id = $5,
        chef_projet_nom = $6,
        date_depot = $7,
        groupement = $8,
        nom_partenaire = $9,
        type_dao = $10
      WHERE id = $11 RETURNING *`, [objet, reference, description, autorite, chef_id, chef_projet_nom, date_depot, groupement, nom_partenaire, type_dao, id]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'DAO non trouvé'
            });
        }
        // Gérer la mise à jour des membres d'équipe
        let updatedMembers = [];
        if (membres && Array.isArray(membres)) {
            // Créer la table dao_members si elle n'existe pas
            await (0, database_1.query)(`
        CREATE TABLE IF NOT EXISTS dao_members (
          id SERIAL PRIMARY KEY,
          dao_id INTEGER NOT NULL REFERENCES daos(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          assigned_by INTEGER REFERENCES users(id),
          UNIQUE(dao_id, user_id)
        )
      `);
            // Supprimer tous les membres existants pour ce DAO
            await (0, database_1.query)('DELETE FROM dao_members WHERE dao_id = $1', [id]);
            // Ajouter les nouveaux membres
            for (const memberId of membres) {
                await (0, database_1.query)(`
          INSERT INTO dao_members (dao_id, user_id, assigned_by)
          VALUES ($1, $2, $3)
          ON CONFLICT (dao_id, user_id) DO NOTHING
        `, [id, memberId, chef_id]);
            }
            updatedMembers = membres;
        }
        res.status(200).json({
            success: true,
            message: 'DAO modifié avec succès',
            data: {
                dao: result.rows[0],
                membres: updatedMembers
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la modification du DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la modification du DAO'
        });
    }
}
async function deleteDao(req, res) {
    try {
        const { id } = req.params;
        // Récupérer le numéro du DAO avant suppression
        const daoResult = await (0, database_1.query)('SELECT numero FROM daos WHERE id = $1', [id]);
        if (daoResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'DAO non trouvé'
            });
        }
        const daoNumero = daoResult.rows[0].numero;
        console.log('🗑️ Suppression du DAO:', daoNumero);
        // Extraire l'année et la séquence du numéro
        const match = daoNumero.match(/DAO-(\d+)-(\d+)/);
        if (match && match[1] && match[2]) {
            const year = parseInt(match[1]);
            const deletedSeq = parseInt(match[2]);
            console.log('📍 Année:', year, 'Séquence supprimée:', deletedSeq);
            // Compter tous les DAO pour cette année
            const allDaosResult = await (0, database_1.query)('SELECT COUNT(*) as count FROM daos WHERE numero LIKE $1', [`DAO-${year}-%`]);
            const totalDaos = allDaosResult.rows[0].count;
            console.log('📊 Total DAO pour cette année:', totalDaos);
            if (totalDaos <= 1) {
                // Si c'est le dernier DAO, réinitialiser à 0
                console.log('🔄 Dernier DAO supprimé, réinitialisation de la séquence...');
                await (0, database_1.query)('INSERT INTO dao_sequences (year, seq) VALUES ($1, $2) ON CONFLICT (year) DO UPDATE SET seq = $2', [year, 0]);
                // Réinitialiser aussi la séquence d'ID PostgreSQL
                await (0, database_1.query)('ALTER SEQUENCE daos_id_seq RESTART WITH 1');
                console.log('✅ Séquence réinitialisée à 0 et ID réinitialisé à 1');
            }
            else {
                // Sinon, trouver la plus haute séquence restante
                const maxSeqResult = await (0, database_1.query)('SELECT numero FROM daos WHERE numero LIKE $1 ORDER BY numero DESC LIMIT 1', [`DAO-${year}-%`]);
                if (maxSeqResult.rowCount > 0) {
                    const maxNumero = maxSeqResult.rows[0].numero;
                    const maxMatch = maxNumero.match(/DAO-(\d+)-(\d+)/);
                    if (maxMatch && maxMatch[2]) {
                        const maxSeq = parseInt(maxMatch[2]);
                        console.log('📍 Plus haute séquence restante:', maxSeq);
                        await (0, database_1.query)('INSERT INTO dao_sequences (year, seq) VALUES ($1, $2) ON CONFLICT (year) DO UPDATE SET seq = $2', [year, maxSeq]);
                        console.log('✅ Séquence mise à jour à:', maxSeq);
                    }
                }
            }
        }
        // Purger les données liées au DAO avant suppression pour éviter toute réutilisation accidentelle
        await (0, database_1.query)('DELETE FROM task WHERE dao_id = $1', [id]);
        await (0, database_1.query)('DELETE FROM tasks WHERE dao_id = $1', [id]).catch(() => {
            console.log('Table legacy tasks absente ou déjà nettoyée pour le DAO:', id);
        });
        await (0, database_1.query)('DELETE FROM dao_members WHERE dao_id = $1', [id]).catch(() => {
            console.log('Table dao_members absente ou déjà nettoyée pour le DAO:', id);
        });
        // Supprimer le DAO
        const result = await (0, database_1.query)('DELETE FROM daos WHERE id = $1', [id]);
        res.status(200).json({
            success: true,
            message: 'DAO supprimé avec succès',
            data: {
                numero: daoNumero,
                sequenceUpdated: true
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la suppression du DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression du DAO'
        });
    }
}
async function archiveDao(req, res) {
    try {
        const { id } = req.params;
        const result = await (0, database_1.query)('UPDATE daos SET statut = $1 WHERE id = $2 RETURNING *', ['ARCHIVE', id]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'DAO non trouvé'
            });
        }
        res.status(200).json({
            success: true,
            message: 'DAO archivé avec succès',
            data: {
                dao: result.rows[0]
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de l\'archivage du DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'archivage du DAO'
        });
    }
}
async function getMyDaos(req, res) {
    try {
        const userId = req.user?.userId; // Récupérer l'ID de l'utilisateur connecté depuis le token JWT
        // Récupérer les DAO où l'utilisateur est chef de projet
        const chefDaosResult = await (0, database_1.query)(`
      SELECT 
        d.id,
        d.numero,
        d.objet,
        d.date_depot,
        d.reference,
        d.autorite,
        d.chef_id,
        d.chef_projet_nom,
        d.groupement,
        d.statut,
        d.created_at,
        u.email as chef_projet_email,
        'chef' as role
      FROM daos d
      LEFT JOIN users u ON d.chef_id = u.id
      WHERE d.chef_id = $1
    `, [userId]);
        // Récupérer les DAO où l'utilisateur est membre d'équipe
        let memberDaos = [];
        try {
            const memberDaosResult = await (0, database_1.query)(`
        SELECT 
          d.id,
          d.numero,
          d.objet,
          d.date_depot,
          d.reference,
          d.autorite,
          d.chef_id,
          d.chef_projet_nom,
          d.groupement,
          d.statut,
          d.created_at,
          u.email as chef_projet_email,
          'membre' as role
        FROM dao_members dm
        JOIN daos d ON dm.dao_id = d.id
        LEFT JOIN users u ON d.chef_id = u.id
        WHERE dm.user_id = $1
      `, [userId]);
            memberDaos = memberDaosResult.rows;
        }
        catch (error) {
            // Si la table dao_members n'existe pas encore, on continue avec seulement les DAO de chef
            console.log('Table dao_members non trouvée pour l\'utilisateur:', userId);
        }
        // Combiner les deux listes et supprimer les doublons
        const allDaos = [...chefDaosResult.rows, ...memberDaos];
        // Supprimer les doublons (si un utilisateur est à la fois chef et membre)
        const uniqueDaos = allDaos.filter((dao, index, self) => index === self.findIndex((d) => d.id === dao.id));
        res.status(200).json({
            success: true,
            data: {
                daos: uniqueDaos
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des DAO de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des DAO de l\'utilisateur'
        });
    }
}
async function getDaoTasks(req, res) {
    try {
        const { id } = req.params;
        let result = await (0, database_1.query)(`
      SELECT
        t.id,
        t.nom,
        t.statut,
        t.progress,
        t.assigned_to,
        u.username as assigned_username,
        u.email as assigned_email
      FROM task t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.dao_id = $1
      ORDER BY t.id ASC
    `, [id]);
        // Si aucune tâche n'existe dans `task`, migrer automatiquement depuis l'ancienne table `tasks`.
        if (result.rowCount === 0) {
            try {
                const legacyResult = await (0, database_1.query)(`
          SELECT id, titre, statut, progress, assigned_to
          FROM tasks
          WHERE dao_id = $1
          ORDER BY id ASC
        `, [id]);
                if (legacyResult.rowCount > 0) {
                    for (const legacyTask of legacyResult.rows) {
                        await (0, database_1.query)(`INSERT INTO task (nom, dao_id, statut, progress, assigned_to)
               VALUES ($1, $2, $3, $4, $5)`, [
                            legacyTask.titre,
                            Number(id),
                            legacyTask.statut || 'a_faire',
                            legacyTask.progress || 0,
                            legacyTask.assigned_to || null
                        ]);
                    }
                    result = await (0, database_1.query)(`
            SELECT
              t.id,
              t.nom,
              t.statut,
              t.progress,
              t.assigned_to,
              u.username as assigned_username,
              u.email as assigned_email
            FROM task t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.dao_id = $1
            ORDER BY t.id ASC
          `, [id]);
                }
            }
            catch (legacyError) {
                console.log('Table legacy tasks indisponible pour le DAO:', id);
            }
        }
        const tasks = result.rows.map((task) => ({
            id: task.id,
            id_task: task.id,
            nom: task.nom,
            statut: task.statut,
            progress: task.progress || 0,
            assigned_to: task.assigned_to,
            assigned_username: task.assigned_username,
            assigned_email: task.assigned_email,
            priorite: 'moyenne',
            date_echeance: null
        }));
        // Calculer la progression du DAO (sur les taches assignees uniquement)
        const assignedTasks = tasks.filter((t) => t.assigned_to !== null);
        const completedTasks = assignedTasks.filter((t) => t.statut === 'termine' || Number(t.progress || 0) >= 100);
        const daoProgress = assignedTasks.length > 0
            ? Math.round(assignedTasks.reduce((sum, t) => sum + Number(t.progress || 0), 0) /
                assignedTasks.length)
            : 0;
        console.log(`📊 DAO ${id}: ${completedTasks.length}/${assignedTasks.length} tâches terminées = ${daoProgress}%`);
        res.status(200).json({
            success: true,
            data: {
                tasks,
                dao_progress: daoProgress,
                dao_stats: {
                    total_tasks: tasks.length,
                    assigned_tasks: assignedTasks.length,
                    completed_tasks: completedTasks.length
                }
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des tâches du DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des tâches du DAO'
        });
    }
}
async function getDaoAssignableMembers(req, res) {
    try {
        const { id } = req.params;
        // Vérifier que le DAO existe
        const daoResult = await (0, database_1.query)(`
      SELECT id FROM daos WHERE id = $1
    `, [id]);
        if (daoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'DAO non trouvé'
            });
        }
        // Récupérer SEULEMENT les membres assignés au DAO
        const membersResult = await (0, database_1.query)(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.role_id,
        u.url_photo
      FROM users u
      INNER JOIN dao_members dm ON u.id = dm.user_id
      WHERE dm.dao_id = $1
      ORDER BY u.username
    `, [id]);
        res.status(200).json({
            success: true,
            data: {
                members: membersResult.rows
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des membres assignables:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des membres assignables'
        });
    }
}
async function createDao(req, res) {
    try {
        console.log('=== DÉBUT CRÉATION DAO - LOGIQUE COMPLÈTE ===');
        console.log('Body reçu:', JSON.stringify(req.body, null, 2));
        const { date_depot, type_dao, objet, description, reference, autorite, chef_id, chef_projet_nom, membres, groupement, nom_partenaire } = req.body;
        // Validation complète des données
        const validationErrors = [];
        if (!date_depot)
            validationErrors.push("La date de dépôt est requise.");
        if (!type_dao)
            validationErrors.push("Le type de DAO est requis.");
        if (!objet)
            validationErrors.push("L'objet est requis.");
        if (!description || description.trim().length < 5)
            validationErrors.push("La description doit contenir au moins 5 caractères.");
        if (!reference)
            validationErrors.push("La référence est requise.");
        if (!autorite)
            validationErrors.push("L'autorité contractante est requise.");
        if (!chef_id)
            validationErrors.push("Le chef d'équipe doit être assigné.");
        if (!membres || membres.length === 0)
            validationErrors.push("Au moins un membre d'équipe doit être sélectionné.");
        // Validation dynamique du groupement
        if (groupement === "oui" && (!nom_partenaire || !nom_partenaire.trim())) {
            validationErrors.push("Le nom de l'entreprise partenaire est requis lorsque le groupement est sélectionné.");
        }
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join("; ")
            });
        }
        console.log('Validation passée');
        // 1. Génération atomique du numéro DAO
        const year = new Date().getFullYear();
        console.log("=== GÉNÉRATION ATOMIQUE DU NUMÉRO DAO - DÉBUT ===");
        // Méthode atomique avec séquence PostgreSQL
        const sequenceResult = await (0, database_1.query)(`INSERT INTO dao_sequences (year, seq) VALUES ($1, 1)
       ON CONFLICT (year) DO UPDATE SET seq = dao_sequences.seq + 1
       RETURNING seq`, [year]);
        const nextSeq = sequenceResult.rows[0].seq;
        const generatedNumero = `DAO-${year}-${String(nextSeq).padStart(3, "0")}`;
        console.log("Année:", year);
        console.log("Séquence atomique:", nextSeq);
        console.log("Numéro généré (réel):", generatedNumero);
        // 2. Insertion du DAO
        const daoResult = await (0, database_1.query)(`
      INSERT INTO daos (
        numero, date_depot, objet, description, reference, autorite, 
        statut, chef_id, chef_projet_nom, groupement, nom_partenaire, type_dao, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
            generatedNumero,
            date_depot,
            objet,
            description,
            reference,
            autorite,
            'actif', // Statut initial
            Number(chef_id),
            chef_projet_nom,
            groupement || null,
            groupement === "oui" ? nom_partenaire : null,
            type_dao || null,
        ]);
        const createdDao = daoResult.rows[0];
        // 3. Ajout des membres à l'équipe DAO
        for (const memberId of membres) {
            await (0, database_1.query)("INSERT INTO dao_members (dao_id, user_id, assigned_by) VALUES ($1, $2, $3)", [createdDao.id, Number(memberId), Number(chef_id)]);
        }
        console.log('Membres ajoutés à l\'équipe DAO:', membres.length);
        // 4. Création des tâches par défaut (15 tâches)
        const defaultTasks = [
            'Résumé sommaire DAO et Création du drive',
            'Demande de caution et garanties',
            'Identification et renseignement des profils dans le drive',
            'Identification et renseignement des ABE dans le drive',
            'Légalisation des ABE, diplômes, certificats, attestations et pièces administratives requis',
            'Indication directive d\'élaboration de l\'offre financier',
            'Elaboration de la méthodologie',
            'Planification prévisionnelle',
            'Identification des références précises des équipements et matériels',
            'Demande de cotation',
            'Elaboration du squelette des offres',
            'Rédaction du contenu des OF et OT',
            'Contrôle et validation des offres',
            'Impression et présentation des offres (Valider l\'étiquette)',
            'Dépôt des offres et clôture'
        ];
        for (const taskName of defaultTasks) {
            await (0, database_1.query)(`INSERT INTO task (dao_id, nom, statut, progress)
         VALUES ($1, $2, 'a_faire', 0)`, [createdDao.id, taskName]);
        }
        console.log('Tâches par défaut créées:', defaultTasks.length);
        // 5. Récupération des informations du chef de projet pour notification
        const chefResult = await (0, database_1.query)(`SELECT username, email FROM users WHERE id = $1`, [Number(chef_id)]);
        const chefInfo = chefResult.rows[0];
        if (chefInfo) {
            console.log('Chef de projet identifié:', chefInfo.username);
            // TODO: Implémenter l'envoi d'email
            // await sendDaoCreationEmail(objet, chefInfo.username, chefInfo.email);
        }
        // 6. Retourner la réponse complète
        res.status(201).json({
            success: true,
            message: 'DAO créé avec succès',
            data: {
                dao: {
                    ...createdDao,
                    numero: generatedNumero
                },
                membres: membres,
                chef: chefInfo
            }
        });
        console.log('DAO créé avec succès - Numéro:', generatedNumero);
    }
    catch (error) {
        console.error('Erreur lors de la création du DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création du DAO'
        });
    }
}
//# sourceMappingURL=daoController.js.map