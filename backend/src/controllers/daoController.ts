import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { query } from "../utils/database";

export async function getAllDaos(req: AuthenticatedRequest, res: Response) {
  try {
    let daoQuery = `
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
        d.created_at,
        u.email as chef_projet_email
      FROM daos d
      LEFT JOIN users u ON d.chef_id = u.id
    `;
    let params: any[] = [];

    // Filtrer selon le rôle de l'utilisateur
    if (req.user?.roleId === 3) {
      // Chef de projet : voit seulement ses DAOs
      daoQuery += " WHERE d.chef_id = $1";
      params.push(req.user.userId);
    }
    // Admin (role_id = 2) : voit TOUS les DAOs (vue globale)

    daoQuery += " ORDER BY d.created_at DESC";

    const result = await query(daoQuery, params);

    res.status(200).json({
      success: true,
      data: {
        daos: result.rows,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des DAO",
    });
  }
}

export async function getNextDaoNumber(req: Request, res: Response) {
  try {
    // Récupérer le dernier numéro de DAO
    const result = await query(
      "SELECT reference FROM daos ORDER BY id DESC LIMIT 1",
    );

    let nextNumber = "DAO-2026-001"; // Valeur par défaut

    if (result.rows.length > 0) {
      const lastRef = result.rows[0].reference;
      // Extraire le numéro de la référence (ex: "DAO-2026-001" -> "001")
      const match = lastRef.match(/DAO-2026-(\d+)/);
      if (match) {
        const lastNum = parseInt(match[1]);
        const nextNum = (lastNum + 1).toString().padStart(3, "0");
        nextNumber = `DAO-2026-${nextNum}`;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        nextNumber,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du numéro DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du numéro DAO",
    });
  }
}

export async function getDaoTypes(req: Request, res: Response) {
  try {
    const result = await query("SELECT * FROM dao_types ORDER BY libelle");

    res.status(200).json({
      success: true,
      data: {
        types: result.rows,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des types de DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des types de DAO",
    });
  }
}

export async function getDao(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await query(
      `
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
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "DAO non trouvé",
      });
    }

    const dao = result.rows[0];

    // Récupérer les membres d'équipe du DAO
    let members = [];
    try {
      const membersResult = await query(
        `
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
      `,
        [id],
      );

      members = membersResult.rows.map((member: any) => ({
        id: member.user_id,
        username: member.username,
        email: member.email,
        role_id: member.role_id,
        assigned_at: member.assigned_at,
      }));
    } catch (error) {
      // Si la table dao_members n'existe pas encore, on continue sans membres
      console.log("Table dao_members non trouvée ou vide pour le DAO:", id);
    }

    res.status(200).json({
      success: true,
      data: {
        dao: { ...dao, membres: members.map((m: any) => m.id) },
        members: members,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du DAO",
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
      membres,
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
      [
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
        id,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "DAO non trouvé",
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
      await query("DELETE FROM dao_members WHERE dao_id = $1", [id]);

      // Ajouter les nouveaux membres
      for (const memberId of membres) {
        await query(
          `
          INSERT INTO dao_members (dao_id, user_id, assigned_by)
          VALUES ($1, $2, $3)
          ON CONFLICT (dao_id, user_id) DO NOTHING
        `,
          [id, memberId, chef_id],
        );
      }
      updatedMembers = membres;
    }

    res.status(200).json({
      success: true,
      message: "DAO modifié avec succès",
      data: {
        dao: result.rows[0],
        membres: updatedMembers,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la modification du DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la modification du DAO",
    });
  }
}

export async function deleteDao(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Récupérer le numéro du DAO avant suppression
    const daoResult = await query("SELECT numero FROM daos WHERE id = $1", [
      id,
    ]);

    if (daoResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "DAO non trouvé",
      });
    }

    const daoNumero = daoResult.rows[0].numero;
    console.log("🗑️ Suppression du DAO:", daoNumero);

    // Extraire l'année et la séquence du numéro
    const match = daoNumero.match(/DAO-(\d+)-(\d+)/);
    if (match && match[1] && match[2]) {
      const year = parseInt(match[1]);
      const deletedSeq = parseInt(match[2]);

      console.log("📍 Année:", year, "Séquence supprimée:", deletedSeq);

      // Compter tous les DAO pour cette année
      const allDaosResult = await query(
        "SELECT COUNT(*) as count FROM daos WHERE numero LIKE $1",
        [`DAO-${year}-%`],
      );
      const totalDaos = allDaosResult.rows[0].count;

      console.log("📊 Total DAO pour cette année:", totalDaos);

      if (totalDaos <= 1) {
        // Si c'est le dernier DAO, réinitialiser à 0
        console.log(
          "🔄 Dernier DAO supprimé, réinitialisation de la séquence...",
        );

        await query(
          "INSERT INTO dao_sequences (year, seq) VALUES ($1, $2) ON CONFLICT (year) DO UPDATE SET seq = $2",
          [year, 0],
        );

        // Réinitialiser aussi la séquence d'ID PostgreSQL
        await query("ALTER SEQUENCE daos_id_seq RESTART WITH 1");

        console.log("✅ Séquence réinitialisée à 0 et ID réinitialisé à 1");
      } else {
        // Sinon, trouver la plus haute séquence restante
        const maxSeqResult = await query(
          "SELECT numero FROM daos WHERE numero LIKE $1 ORDER BY numero DESC LIMIT 1",
          [`DAO-${year}-%`],
        );

        if (maxSeqResult.rowCount > 0) {
          const maxNumero = maxSeqResult.rows[0].numero;
          const maxMatch = maxNumero.match(/DAO-(\d+)-(\d+)/);

          if (maxMatch && maxMatch[2]) {
            const maxSeq = parseInt(maxMatch[2]);
            console.log("📍 Plus haute séquence restante:", maxSeq);

            await query(
              "INSERT INTO dao_sequences (year, seq) VALUES ($1, $2) ON CONFLICT (year) DO UPDATE SET seq = $2",
              [year, maxSeq],
            );

            console.log("✅ Séquence mise à jour à:", maxSeq);
          }
        }
      }
    }

    // Purger les données liées au DAO avant suppression pour éviter toute réutilisation accidentelle
    await query("DELETE FROM task WHERE dao_id = $1", [id]);
    await query("DELETE FROM tasks WHERE dao_id = $1", [id]).catch(() => {
      console.log(
        "Table legacy tasks absente ou déjà nettoyée pour le DAO:",
        id,
      );
    });
    await query("DELETE FROM dao_members WHERE dao_id = $1", [id]).catch(() => {
      console.log(
        "Table dao_members absente ou déjà nettoyée pour le DAO:",
        id,
      );
    });

    // Supprimer le DAO
    const result = await query("DELETE FROM daos WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "DAO supprimé avec succès",
      data: {
        numero: daoNumero,
        sequenceUpdated: true,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression du DAO",
    });
  }
}

export async function archiveDao(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await query(
      "UPDATE daos SET statut = $1 WHERE id = $2 RETURNING *",
      ["ARCHIVE", id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "DAO non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "DAO archivé avec succès",
      data: {
        dao: result.rows[0],
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'archivage du DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'archivage du DAO",
    });
  }
}

export async function getFinishedDaos(req: Request, res: Response) {
  try {
    const result = await query(`
      SELECT 
        d.id,
        d.numero,
        d.objet,
        d.date_depot,
        d.created_at as date_fin,
        d.chef_projet_nom as equipe,
        d.chef_projet_nom as chef_projet,
        d.statut
      FROM daos d
      WHERE d.statut IN ('TERMINEE', 'ANNULE', 'ARCHIVE')
      ORDER BY d.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: {
        daos: result.rows
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des DAO terminés:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des DAO terminés",
    });
  }
}

export async function markDaoAsFinished(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await query(
      "UPDATE daos SET statut = $1 WHERE id = $2 RETURNING *",
      ["TERMINE", id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "DAO non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "DAO marqué comme terminé avec succès",
      data: {
        dao: result.rows[0],
      },
    });
  } catch (error) {
    console.error("Erreur lors du marquage du DAO comme terminé:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors du marquage du DAO comme terminé",
    });
  }
}

export async function checkAndUpdateDaoStatus(daoId: number) {
  try {
    // Récupérer toutes les tâches du DAO (assignées et non assignées)
    const tasksResult = await query(`
      SELECT 
        id, 
        statut, 
        progress,
        assigned_to,
        created_at
      FROM tasks 
      WHERE dao_id = $1
    `, [daoId]);

    // Récupérer les informations du DAO pour la logique temporelle
    const daoResult = await query(`
      SELECT date_depot, created_at, statut as current_statut
      FROM daos 
      WHERE id = $1
    `, [daoId]);

    if (daoResult.rowCount === 0) {
      return;
    }

    const dao = daoResult.rows[0];
    const totalTasks = tasksResult.rows.length;
    const assignedTasks = tasksResult.rows.filter((task: any) => task.assigned_to !== null);
    const completedTasks = assignedTasks.filter((task: any) => 
      task.statut === 'termine' || Number(task.progress || 0) >= 100
    );
    
    let newStatus: string;

    // Logique simplifiée à 3 statuts
    if (assignedTasks.length === 0) {
      // Par défaut : EN_COURS si aucune tâche assignée
      newStatus = 'EN_COURS';
    } else {
      // Calculer la progression moyenne sur les TÂCHES ASSIGNÉES uniquement
      const totalProgress = assignedTasks.reduce((sum: number, task: any) => 
        sum + Number(task.progress || 0), 0);
      const avgProgress = assignedTasks.length > 0 ? totalProgress / assignedTasks.length : 0;
      
      // Compter les tâches assignées complétées (progress = 100 OU statut = 'termine')
      const allCompletedTasks = assignedTasks.filter((task: any) => 
        task.statut === 'termine' || Number(task.progress || 0) >= 100
      );
      
      // TERMINEE : Toutes les tâches assignées sont complétées ET progression moyenne = 100%
      if (allCompletedTasks.length === assignedTasks.length && Math.round(avgProgress) === 100) {
        newStatus = 'TERMINEE';
      } else if (avgProgress > 0) {
        // EN_COURS : Il y a de la progression mais pas tout terminé
        newStatus = 'EN_COURS';
      } else {
        // A_RISQUE : Aucune progression ET plus de 3 jours depuis la date de dépôt
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        if (dao.date_depot && new Date(dao.date_depot) < threeDaysAgo) {
          newStatus = 'A_RISQUE';
        } else {
          newStatus = 'EN_COURS'; // Par défaut
        }
      }
    }

    // Mettre à jour le statut seulement s'il a changé
    if (newStatus !== dao.current_statut) {
      await query(
        "UPDATE daos SET statut = $1 WHERE id = $2",
        [newStatus, daoId]
      );
      console.log(`DAO ${daoId}: statut mis à jour de '${dao.current_statut}' à '${newStatus}'`);
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du statut du DAO:", error);
  }
}

export async function diagnoseDaoStatus(req: Request, res: Response) {
  try {
    // Récupérer tous les DAO avec leurs statistiques de tâches
    const result = await query(`
      SELECT 
        d.id,
        d.numero,
        d.objet,
        d.statut as current_statut,
        d.date_depot,
        d.created_at,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.statut = 'termine' OR t.progress >= 100 THEN 1 END) as completed_tasks,
        COALESCE(SUM(t.progress), 0) as total_progress,
        CASE 
          WHEN COUNT(CASE WHEN t.statut = 'termine' OR t.progress >= 100 THEN 1 END) = COUNT(t.id) 
               AND ROUND(COALESCE(SUM(t.progress), 0) / NULLIF(COUNT(t.id), 0)) = 100
          THEN 'TERMINEE'
          WHEN COALESCE(SUM(t.progress), 0) / NULLIF(COUNT(t.id), 0) > 0 
          THEN 'EN_COURS'
          WHEN d.date_depot IS NOT NULL AND d.date_depot < NOW() - INTERVAL '3 days'
               AND COALESCE(SUM(t.progress), 0) / NULLIF(COUNT(t.id), 0) = 0
          THEN 'A_RISQUE'
          ELSE 'EN_COURS'
        END as calculated_statut,
        ROUND(COALESCE(SUM(t.progress), 0) / NULLIF(COUNT(t.id), 0)) as avg_progress
      FROM daos d
      LEFT JOIN tasks t ON d.id = t.dao_id
      GROUP BY d.id, d.numero, d.objet, d.statut, d.date_depot, d.created_at
      ORDER BY d.created_at DESC
    `);

    const diagnostics = result.rows.map((dao: any) => ({
      id: dao.id,
      numero: dao.numero,
      objet: dao.objet,
      current_statut: dao.current_statut,
      calculated_statut: dao.calculated_statut,
      needs_update: dao.current_statut !== dao.calculated_statut,
      date_depot: dao.date_depot,
      created_at: dao.created_at,
      statistics: {
        total_tasks: parseInt(dao.total_tasks),
        assigned_tasks: parseInt(dao.assigned_tasks),
        completed_tasks: parseInt(dao.completed_tasks),
        avg_progress: parseInt(dao.avg_progress) || 0
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        diagnostics,
        total_daos: diagnostics.length,
        daos_needing_update: diagnostics.filter((d: any) => d.needs_update).length
      }
    });
  } catch (error) {
    console.error("Erreur lors du diagnostic des statuts de DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors du diagnostic des statuts de DAO"
    });
  }
}

export async function updateAllDaoStatus(req: Request, res: Response) {
  try {
    // Récupérer tous les DAO
    const daosResult = await query("SELECT id FROM daos");
    
    let updatedCount = 0;
    const errors: string[] = [];

    // Mettre à jour le statut de chaque DAO
    for (const dao of daosResult.rows) {
      try {
        const oldStatusResult = await query("SELECT statut FROM daos WHERE id = $1", [dao.id]);
        const oldStatus = oldStatusResult.rows[0]?.statut;
        
        await checkAndUpdateDaoStatus(dao.id);
        
        const newStatusResult = await query("SELECT statut FROM daos WHERE id = $1", [dao.id]);
        const newStatus = newStatusResult.rows[0]?.statut;
        
        if (oldStatus !== newStatus) {
          updatedCount++;
          console.log(`DAO ${dao.id}: ${oldStatus} -> ${newStatus}`);
        }
      } catch (error) {
        errors.push(`DAO ${dao.id}: ${error}`);
        console.error(`Erreur lors de la mise à jour du DAO ${dao.id}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: "Mise à jour des statuts de DAO terminée",
      data: {
        total_processed: daosResult.rows.length,
        updated_count: updatedCount,
        errors: errors.length > 0 ? errors : null
      }
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des statuts de DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour des statuts de DAO"
    });
  }
}

export async function getMyDaos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId; // Récupérer l'ID de l'utilisateur connecté depuis le token JWT

    // Récupérer les DAO où l'utilisateur est chef de projet
    const chefDaosResult = await query(
      `
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
        d.created_at,
        u.email as chef_projet_email,
        'chef' as role
      FROM daos d
      LEFT JOIN users u ON d.chef_id = u.id
      WHERE d.chef_id = $1
    `,
      [userId],
    );

    // Récupérer les DAO où l'utilisateur est membre d'équipe
    let memberDaos = [];
    try {
      const memberDaosResult = await query(
        `
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
          d.created_at,
          u.email as chef_projet_email,
          'membre' as role
        FROM dao_members dm
        JOIN daos d ON dm.dao_id = d.id
        LEFT JOIN users u ON d.chef_id = u.id
        WHERE dm.user_id = $1
      `,
        [userId],
      );

      memberDaos = memberDaosResult.rows;
    } catch (error) {
      // Si la table dao_members n'existe pas encore, on continue avec seulement les DAO de chef
      console.log("Table dao_members non trouvée pour l'utilisateur:", userId);
    }

    // Combiner les deux listes et supprimer les doublons
    const allDaos = [...chefDaosResult.rows, ...memberDaos];

    // Supprimer les doublons (si un utilisateur est à la fois chef et membre)
    const uniqueDaos = allDaos.filter(
      (dao, index, self) =>
        index === self.findIndex((d: any) => d.id === dao.id),
    );

    res.status(200).json({
      success: true,
      data: {
        daos: uniqueDaos,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des DAO de l'utilisateur:",
      error,
    );
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des DAO de l'utilisateur",
    });
  }
}

export async function getDaoTasks(req: Request, res: Response) {
  try {
    const { id } = req.params;

    let result = await query(
      `
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
    `,
      [id],
    );

    // Si aucune tâche n'existe dans `task`, migrer automatiquement depuis l'ancienne table `tasks`.
    if (result.rowCount === 0) {
      try {
        const legacyResult = await query(
          `
          SELECT id, titre, statut, progress, assigned_to
          FROM tasks
          WHERE dao_id = $1
          ORDER BY id ASC
        `,
          [id],
        );

        if (legacyResult.rowCount > 0) {
          for (const legacyTask of legacyResult.rows) {
            await query(
              `INSERT INTO task (nom, dao_id, statut, progress, assigned_to)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                legacyTask.titre,
                Number(id),
                legacyTask.statut || "a_faire",
                legacyTask.progress || 0,
                legacyTask.assigned_to || null,
              ],
            );
          }

          result = await query(
            `
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
          `,
            [id],
          );
        }
      } catch (legacyError) {
        console.log("Table legacy tasks indisponible pour le DAO:", id);
      }
    }

    const tasks = result.rows.map((task: any) => ({
      id: task.id,
      id_task: task.id,
      nom: task.nom,
      statut: task.statut,
      progress: task.progress || 0,
      assigned_to: task.assigned_to,
      assigned_username: task.assigned_username,
      assigned_email: task.assigned_email,
      priorite: "moyenne",
      date_echeance: null,
    }));

    // Calculer la progression du DAO (sur les taches assignees uniquement)
    const assignedTasks = tasks.filter((t: any) => t.assigned_to !== null);
    const completedTasks = assignedTasks.filter(
      (t: any) => t.statut === "termine" || Number(t.progress || 0) >= 100,
    );
    const daoProgress =
      assignedTasks.length > 0
        ? Math.round(
            assignedTasks.reduce(
              (sum: number, t: any) => sum + Number(t.progress || 0),
              0,
            ) / assignedTasks.length,
          )
        : 0;

    console.log(
      `📊 DAO ${id}: ${completedTasks.length}/${assignedTasks.length} tâches terminées = ${daoProgress}%`,
    );

    res.status(200).json({
      success: true,
      data: {
        tasks,
        dao_progress: daoProgress,
        dao_stats: {
          total_tasks: tasks.length,
          assigned_tasks: assignedTasks.length,
          completed_tasks: completedTasks.length,
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches du DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des tâches du DAO",
    });
  }
}

export async function getDaoAssignableMembers(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Vérifier que le DAO existe
    const daoResult = await query(
      `
      SELECT id FROM daos WHERE id = $1
    `,
      [id],
    );

    if (daoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "DAO non trouvé",
      });
    }

    // Récupérer SEULEMENT les membres assignés au DAO
    const membersResult = await query(
      `
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
    `,
      [id],
    );

    res.status(200).json({
      success: true,
      data: {
        members: membersResult.rows,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des membres assignables:",
      error,
    );
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des membres assignables",
    });
  }
}

export async function createDao(req: Request, res: Response) {
  try {
    console.log("=== DÉBUT CRÉATION DAO - LOGIQUE COMPLÈTE ===");
    console.log("Body reçu:", JSON.stringify(req.body, null, 2));

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
      nom_partenaire,
    } = req.body;

    // Validation complète des données
    const validationErrors = [];

    if (!date_depot) validationErrors.push("La date de dépôt est requise.");
    if (!type_dao) validationErrors.push("Le type de DAO est requis.");
    if (!objet) validationErrors.push("L'objet est requis.");
    if (!description || description.trim().length < 5)
      validationErrors.push(
        "La description doit contenir au moins 5 caractères.",
      );
    if (!reference) validationErrors.push("La référence est requise.");
    if (!autorite)
      validationErrors.push("L'autorité contractante est requise.");
    if (!chef_id) validationErrors.push("Le chef d'équipe doit être assigné.");
    if (!membres || membres.length === 0)
      validationErrors.push(
        "Au moins un membre d'équipe doit être sélectionné.",
      );

    // Validation dynamique du groupement
    if (groupement === "oui" && (!nom_partenaire || !nom_partenaire.trim())) {
      validationErrors.push(
        "Le nom de l'entreprise partenaire est requis lorsque le groupement est sélectionné.",
      );
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join("; "),
      });
    }

    console.log("Validation passée");

    // 1. Génération atomique du numéro DAO
    const year = new Date().getFullYear();
    console.log("=== GÉNÉRATION ATOMIQUE DU NUMÉRO DAO - DÉBUT ===");

    // Méthode atomique avec séquence PostgreSQL
    const sequenceResult = await query(
      `INSERT INTO dao_sequences (year, seq) VALUES ($1, 1)
       ON CONFLICT (year) DO UPDATE SET seq = dao_sequences.seq + 1
       RETURNING seq`,
      [year],
    );

    const nextSeq = sequenceResult.rows[0].seq;
    const generatedNumero = `DAO-${year}-${String(nextSeq).padStart(3, "0")}`;

    console.log("Année:", year);
    console.log("Séquence atomique:", nextSeq);
    console.log("Numéro généré (réel):", generatedNumero);

    // 2. Insertion du DAO
    const daoResult = await query(
      `
      INSERT INTO daos (
        numero, date_depot, objet, description, reference, autorite, 
        statut, chef_id, chef_projet_nom, groupement, nom_partenaire, type_dao, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING *
    `,
      [
        generatedNumero,
        date_depot,
        objet,
        description,
        reference,
        autorite,
        "EN_COURS", // Statut initial
        Number(chef_id),
        chef_projet_nom,
        groupement || null,
        groupement === "oui" ? nom_partenaire : null,
        type_dao || null,
      ],
    );

    const createdDao = daoResult.rows[0];

    // 3. Gestion de l'équipe selon la documentation complète
    // 3.1. Créer l'équipe si elle n'existe pas déjà (le trigger s'occupe de créer teams)
    let teamId = createdDao.team_id;
    if (!teamId) {
      // Générer un ID d'équipe unique si le trigger ne s'est pas exécuté
      const teamIdResult = await query(
        "INSERT INTO teams (id, team_code) VALUES ($1, $2) RETURNING id",
        [crypto.randomUUID(), `TEAM-${Date.now()}`]
      );
      teamId = teamIdResult.rows[0].id;
      
      // Mettre à jour le DAO avec le team_id
      await query(
        "UPDATE daos SET team_id = $1 WHERE id = $2",
        [teamId, createdDao.id]
      );
    }
    
    // 3.2. Ajouter les membres à l'équipe (table team_members)
    for (const memberId of membres) {
      // Vérifier si le membre n'existe pas déjà dans team_members
      const existingMember = await query(
        "SELECT team_id FROM team_members WHERE team_id = $1 AND user_id = $2",
        [teamId, Number(memberId)],
      );

      if (existingMember.rows.length === 0) {
        await query(
          "INSERT INTO team_members (team_id, user_id, assigned_by) VALUES ($1, $2, $3)",
          [teamId, Number(memberId), Number(chef_id)],
        );
      }
      
      // Garder aussi l'ancienne table dao_members pour compatibilité
      const existingDaoMember = await query(
        "SELECT id FROM dao_members WHERE dao_id = $1 AND user_id = $2",
        [createdDao.id, Number(memberId)],
      );

      if (existingDaoMember.rows.length === 0) {
        await query(
          "INSERT INTO dao_members (dao_id, user_id, assigned_by) VALUES ($1, $2, $3)",
          [createdDao.id, Number(memberId), Number(chef_id)],
        );
      }
    }
    console.log("Équipe créée avec ID:", teamId, "Membres ajoutés:", membres.length);

    // 4. Création des tâches par défaut (15 tâches)
    const defaultTasks = [
      "Résumé sommaire DAO et Création du drive",
      "Demande de caution et garanties",
      "Identification et renseignement des profils dans le drive",
      "Identification et renseignement des ABE dans le drive",
      "Légalisation des ABE, diplômes, certificats, attestations et pièces administratives requis",
      "Indication directive d'élaboration de l'offre financier",
      "Elaboration de la méthodologie",
      "Planification prévisionnelle",
      "Identification des références précises des équipements et matériels",
      "Demande de cotation",
      "Elaboration du squelette des offres",
      "Rédaction du contenu des OF et OT",
      "Contrôle et validation des offres",
      "Impression et présentation des offres (Valider l'étiquette)",
      "Dépôt des offres et clôture",
    ];

    for (const taskName of defaultTasks) {
      await query(
        `INSERT INTO task (dao_id, nom, statut, progress)
         VALUES ($1, $2, 'a_faire', 0)`,
        [createdDao.id, taskName],
      );
    }
    console.log("Tâches par défaut créées:", defaultTasks.length);

    // 5. Récupération des informations du chef de projet pour notification
    const chefResult = await query(
      `SELECT username, email FROM users WHERE id = $1`,
      [Number(chef_id)],
    );

    const chefInfo = chefResult.rows[0];
    if (chefInfo) {
      console.log("Chef de projet identifié:", chefInfo.username);
      // TODO: Implémenter l'envoi d'email
      // await sendDaoCreationEmail(objet, chefInfo.username, chefInfo.email);
    }

    // 6. Retourner la réponse complète
    res.status(201).json({
      success: true,
      message: "DAO créé avec succès",
      data: {
        dao: {
          ...createdDao,
          numero: generatedNumero,
        },
        membres: membres,
        chef: chefInfo,
      },
    });

    console.log("DAO créé avec succès - Numéro:", generatedNumero);
  } catch (error) {
    console.error("Erreur lors de la création du DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du DAO",
    });
  }
}
