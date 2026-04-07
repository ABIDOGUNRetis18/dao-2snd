import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { query } from '../utils/database';

export async function getAllDaos(req: Request, res: Response) {
  try {
    const result = await query(`
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
  } catch (error) {
    console.error('Erreur lors de la récupération des DAO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des DAO'
    });
  }
}

export async function getNextDaoNumber(req: Request, res: Response) {
  try {
    // Récupérer le dernier numéro de DAO
    const result = await query(
      'SELECT reference FROM daos ORDER BY id DESC LIMIT 1'
    );

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
  } catch (error) {
    console.error('Erreur lors de la récupération du numéro DAO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du numéro DAO'
    });
  }
}

export async function getDaoTypes(req: Request, res: Response) {
  try {
    const result = await query(
      'SELECT * FROM dao_types ORDER BY libelle'
    );

    res.status(200).json({
      success: true,
      data: {
        types: result.rows
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des types de DAO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des types de DAO'
    });
  }
}

export async function getDao(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await query(`
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
      const membersResult = await query(`
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
      
      members = membersResult.rows.map((member: any) => ({
        id: member.user_id,
        username: member.username,
        email: member.email,
        role_id: member.role_id,
        assigned_at: member.assigned_at
      }));
    } catch (error) {
      // Si la table dao_members n'existe pas encore, on continue sans membres
      console.log('Table dao_members non trouvée ou vide pour le DAO:', id);
    }

    res.status(200).json({
      success: true,
      data: {
        dao: { ...dao, membres: members.map((m: any) => m.id) },
        members: members
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du DAO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du DAO'
    });
  }
}

export async function updateDao(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      objet,
      reference,
      description,
      autorite,
      chef_id,
      chef_projet_nom,
      date_depot,
      groupement,
      nom_partenaire,
      type_dao,
      membres
    } = req.body;

    const result = await query(
      `UPDATE daos SET 
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
      WHERE id = $11 RETURNING *`,
      [objet, reference, description, autorite, chef_id, chef_projet_nom, date_depot, groupement, nom_partenaire, type_dao, id]
    );

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
      await query(`
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
      await query('DELETE FROM dao_members WHERE dao_id = $1', [id]);

      // Ajouter les nouveaux membres
      for (const memberId of membres) {
        await query(`
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
  } catch (error) {
    console.error('Erreur lors de la modification du DAO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification du DAO'
    });
  }
}

export async function deleteDao(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Récupérer le numéro du DAO avant suppression
    const daoResult = await query('SELECT numero FROM daos WHERE id = $1', [id]);
    
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
      const allDaosResult = await query(
        'SELECT COUNT(*) as count FROM daos WHERE numero LIKE $1',
        [`DAO-${year}-%`]
      );
      const totalDaos = allDaosResult.rows[0].count;
      
      console.log('📊 Total DAO pour cette année:', totalDaos);
      
      if (totalDaos <= 1) {
        // Si c'est le dernier DAO, réinitialiser à 0
        console.log('🔄 Dernier DAO supprimé, réinitialisation de la séquence...');
        
        await query(
          'INSERT INTO dao_sequences (year, seq) VALUES ($1, $2) ON CONFLICT (year) DO UPDATE SET seq = $2',
          [year, 0]
        );
        
        // Réinitialiser aussi la séquence d'ID PostgreSQL
        await query('ALTER SEQUENCE daos_id_seq RESTART WITH 1');
        
        console.log('✅ Séquence réinitialisée à 0 et ID réinitialisé à 1');
      } else {
        // Sinon, trouver la plus haute séquence restante
        const maxSeqResult = await query(
          'SELECT numero FROM daos WHERE numero LIKE $1 ORDER BY numero DESC LIMIT 1',
          [`DAO-${year}-%`]
        );
        
        if (maxSeqResult.rowCount > 0) {
          const maxNumero = maxSeqResult.rows[0].numero;
          const maxMatch = maxNumero.match(/DAO-(\d+)-(\d+)/);
          
          if (maxMatch && maxMatch[2]) {
            const maxSeq = parseInt(maxMatch[2]);
            console.log('📍 Plus haute séquence restante:', maxSeq);
            
            await query(
              'INSERT INTO dao_sequences (year, seq) VALUES ($1, $2) ON CONFLICT (year) DO UPDATE SET seq = $2',
              [year, maxSeq]
            );
            
            console.log('✅ Séquence mise à jour à:', maxSeq);
          }
        }
      }
    }

    // Supprimer le DAO
    const result = await query('DELETE FROM daos WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'DAO supprimé avec succès',
      data: {
        numero: daoNumero,
        sequenceUpdated: true
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du DAO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du DAO'
    });
  }
}

export async function archiveDao(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE daos SET statut = $1 WHERE id = $2 RETURNING *',
      ['ARCHIVE', id]
    );

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
  } catch (error) {
    console.error('Erreur lors de l\'archivage du DAO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'archivage du DAO'
    });
  }
}

export async function getMyDaos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId; // Récupérer l'ID de l'utilisateur connecté depuis le token JWT

    // Récupérer les DAO où l'utilisateur est chef de projet
    const chefDaosResult = await query(`
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
      const memberDaosResult = await query(`
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
    } catch (error) {
      // Si la table dao_members n'existe pas encore, on continue avec seulement les DAO de chef
      console.log('Table dao_members non trouvée pour l\'utilisateur:', userId);
    }

    // Combiner les deux listes et supprimer les doublons
    const allDaos = [...chefDaosResult.rows, ...memberDaos];
    
    // Supprimer les doublons (si un utilisateur est à la fois chef et membre)
    const uniqueDaos = allDaos.filter((dao, index, self) => 
      index === self.findIndex((d: any) => d.id === dao.id)
    );

    res.status(200).json({
      success: true,
      data: {
        daos: uniqueDaos
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des DAO de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des DAO de l\'utilisateur'
    });
  }
}

export async function getDaoTasks(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        t.id,
        t.nom as titre,
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

    // Formatter les données pour correspondre à l'interface attendue
    const tasks = result.rows.map((task: any) => ({
      id: task.id,
      titre: task.titre,
      statut: task.statut,
      progress: task.progress || 0,
      assigned_to: task.assigned_to,
      assigned_username: task.assigned_username,
      assigned_email: task.assigned_email,
      priorite: 'moyenne', // Valeur par défaut car la table task n'a pas de colonne priorite
      date_echeance: null // Valeur par défaut car la table task n'a pas de colonne date_echeance
    }));

    res.status(200).json({
      success: true,
      data: {
        tasks
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches du DAO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tâches du DAO'
    });
  }
}

export async function getDaoAssignableMembers(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Récupérer les informations du DAO pour obtenir le chef de projet
    const daoResult = await query(`
      SELECT chef_id, chef_projet_nom FROM daos WHERE id = $1
    `, [id]);

    if (daoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'DAO non trouvé'
      });
    }

    const dao = daoResult.rows[0];

    // Récupérer tous les utilisateurs qui peuvent être assignés (Admin, Chef Projet, Membre Équipe)
    const usersResult = await query(`
      SELECT 
        id,
        username,
        email,
        role_id
      FROM users
      WHERE role_id IN (2, 3, 4) -- Admin, ChefProjet, MembreEquipe
      ORDER BY role_id, username
    `);

    // Récupérer les membres déjà assignés à ce DAO
    let assignedMembers = [];
    try {
      const membersResult = await query(`
        SELECT user_id FROM dao_members WHERE dao_id = $1
      `, [id]);
      assignedMembers = membersResult.rows.map((row: any) => row.user_id);
    } catch (error) {
      // Si la table dao_members n'existe pas, on continue sans membres assignés
      console.log('Table dao_members non trouvée pour le DAO:', id);
    }

    // Marquer les utilisateurs comme assignés ou non
    const assignableMembers = usersResult.rows.map((user: any) => ({
      ...user,
      isAssigned: assignedMembers.includes(user.id),
      isChefProjet: user.id === dao.chef_id
    }));

    res.status(200).json({
      success: true,
      data: {
        members: assignableMembers,
        chefProjet: {
          id: dao.chef_id,
          username: dao.chef_projet_nom
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des membres assignables:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des membres assignables'
    });
  }
}

export async function createDao(req: Request, res: Response) {
  try {
    console.log('=== DÉBUT CRÉATION DAO - LOGIQUE COMPLÈTE ===');
    console.log('Body reçu:', JSON.stringify(req.body, null, 2));
    
    const {
      date_depot,
      type_dao,
      objet,
      description,
      reference,
      autorite,
      chef_id,
      chef_projet_nom,
      membres,
      groupement,
      nom_partenaire
    } = req.body;

    // Validation complète des données
    const validationErrors = [];
    
    if (!date_depot) validationErrors.push("La date de dépôt est requise.");
    if (!type_dao) validationErrors.push("Le type de DAO est requis.");
    if (!objet) validationErrors.push("L'objet est requis.");
    if (!description || description.trim().length < 5) validationErrors.push("La description doit contenir au moins 5 caractères.");
    if (!reference) validationErrors.push("La référence est requise.");
    if (!autorite) validationErrors.push("L'autorité contractante est requise.");
    if (!chef_id) validationErrors.push("Le chef d'équipe doit être assigné.");
    if (!membres || membres.length === 0) validationErrors.push("Au moins un membre d'équipe doit être sélectionné.");
    
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

    console.log('✅ Validation passée');

    // 1. Création de l'équipe
    const teamId = `TEAM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const teamCode = `TEAM-${Date.now()}`;
    
    await query(
      "INSERT INTO teams (id, team_code) VALUES ($1, $2)",
      [teamId, teamCode]
    );
    console.log('✅ Équipe créée:', teamId);

    // 2. Génération atomique du numéro DAO (réelle)
    const year = new Date().getFullYear();
    console.log("=== GÉNÉRATION ATOMIQUE DU NUMÉRO DAO - DÉBUT ===");
    
    // Méthode atomique avec séquence PostgreSQL
    const sequenceResult = await query(
      `INSERT INTO dao_sequences (year, seq) VALUES ($1, 1)
       ON CONFLICT (year) DO UPDATE SET seq = dao_sequences.seq + 1
       RETURNING seq`,
      [year]
    );
    
    const nextSeq = sequenceResult.rows[0].seq;
    const generatedNumero = `DAO-${year}-${String(nextSeq).padStart(3, "0")}`;
    
    console.log("Année:", year);
    console.log("Séquence atomique:", nextSeq);
    console.log("Numéro généré (réel):", generatedNumero);
    console.log("=== GÉNÉRATION ATOMIQUE DU NUMÉRO DAO - TERMINÉ ===");

    // 3. Insertion du DAO
    const daoResult = await query(`
      INSERT INTO daos (
        numero, date_depot, objet, description, reference, autorite, 
        statut, chef_id, team_id, groupement, nom_partenaire, type_dao, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      generatedNumero,
      date_depot,
      objet,
      description,
      reference,
      autorite,
      'EN_COURS',              // Statut initial
      Number(chef_id),
      teamId,
      groupement || null,
      groupement === "oui" ? nom_partenaire : null,
      type_dao || null,
    ]);

    const createdDao = daoResult.rows[0];
    console.log('✅ DAO inséré:', createdDao.numero);

    // 4. Ajout des membres à l'équipe
    for (const memberId of membres) {
      await query(
        "INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)",
        [teamId, Number(memberId)]
      );
    }
    console.log('✅ Membres ajoutés à l\'équipe:', membres.length);

    // 5. Création des tâches par défaut (15 tâches)
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
      await query(
        `INSERT INTO task (dao_id, nom, statut, progress) 
         VALUES ($1, $2, 'a_faire', 0)`,
        [createdDao.id, taskName]
      );
    }
    console.log('✅ Tâches par défaut créées:', defaultTasks.length);

    // 6. Récupération des informations du chef de projet pour notification
    const chefResult = await query(
      `SELECT username, email FROM users WHERE id = $1`,
      [Number(chef_id)]
    );

    const chefInfo = chefResult.rows[0];
    if (chefInfo) {
      console.log('✅ Chef de projet identifié:', chefInfo.username);
      // TODO: Implémenter l'envoi d'email
      // await sendDaoCreationEmail(objet, chefInfo.username, chefInfo.email);
    }

    // 7. Retourner la réponse complète
    res.status(201).json({
      success: true,
      message: 'DAO créé avec succès',
      data: {
        dao: {
          ...createdDao,
          numero: generatedNumero
        },
        team: {
          id: teamId,
          code: teamCode,
          membres: membres
        },
        chef: chefInfo
      }
    });

    console.log('🎉 DAO créé avec succès - Numéro:', generatedNumero);

  } catch (error) {
    console.error('❌ Erreur lors de la création du DAO:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du DAO'
    });
  }
}
