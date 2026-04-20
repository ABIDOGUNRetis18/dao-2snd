import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { query } from '../utils/database';

export async function getChefTeams(req: AuthenticatedRequest, res: Response) {
  try {
    const chefId = req.query.chefId as string;
    
    if (!chefId) {
      return res.status(400).json({
        success: false,
        message: "Le paramètre chefId est requis"
      });
    }

    console.log(`Récupération des équipes pour le chef ID: ${chefId}`);

    // Récupérer tous les DAOs où l'utilisateur est chef
    const daosQuery = `
      SELECT 
        d.id AS dao_id,
        d.numero,
        d.objet,
        d.team_id,
        chef.username AS chef_name
      FROM daos d
      LEFT JOIN users chef ON d.chef_id = chef.id
      WHERE d.chef_id = $1
      ORDER BY d.numero ASC
    `;

    const daosResult = await query(daosQuery, [chefId]);

    if (daosResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Pour chaque DAO, récupérer les membres de l'équipe
    const teamsData = await Promise.all(
      daosResult.rows.map(async (dao: any) => {
        // Récupérer les membres de l'équipe pour ce DAO
        const membersQuery = `
          SELECT 
            tm.user_id AS member_id,
            member.username AS member_name,
            member.email AS member_email,
            member.role_id AS member_role_id
          FROM team_members tm
          LEFT JOIN users member ON tm.user_id = member.id
          WHERE tm.team_id = $1
        `;

        const membersResult = await query(membersQuery, [dao.team_id]);

        // Pour chaque membre, récupérer ses tâches
        const membersWithTasks = await Promise.all(
          membersResult.rows.map(async (member: any) => {
            const tasksQuery = `
              SELECT 
                ts.id_task,
                ts.dao_id,
                ts.titre,
                ts.description,
                ts.statut,
                ts.progress,
                ts.created_at,
                d.numero as dao_numero,
                d.objet as dao_objet
              FROM tasks ts
              LEFT JOIN daos d ON ts.dao_id = d.id
              WHERE ts.assigned_to = $1 AND ts.dao_id = $2
              ORDER BY ts.created_at DESC
            `;

            const tasksResult = await query(tasksQuery, [member.member_id, dao.dao_id]);

            return {
              id: member.member_id,
              name: member.member_name,
              email: member.member_email,
              role_id: member.member_role_id,
              role: "Membre d'équipe",
              tasks: tasksResult.rows || []
            };
          })
        );

        return {
          id: dao.dao_id,
          name: dao.numero, // "DAO-2025-001"
          objet: dao.objet,
          leader: dao.chef_name, // "Jean Dupont"
          memberCount: membersResult.rows.length,
          members: membersWithTasks,
          team_id: dao.team_id
        };
      })
    );

    res.status(200).json({
      success: true,
      data: teamsData
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des équipes:", error);
    console.error("Détail de l'erreur:", error instanceof Error ? error.message : 'Erreur inconnue');
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des équipes",
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}
