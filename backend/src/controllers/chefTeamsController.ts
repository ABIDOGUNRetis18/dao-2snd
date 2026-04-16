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

    // Requête SQL selon la documentation
    const result = await query(
      `
      -- Tous les DAOs où l'utilisateur est chef + leurs membres
      SELECT
        d.id AS dao_id,
        d.numero,
        d.objet,
        d.statut,
        d.created_at,
        chef.username AS chef_name,
        chef.email AS chef_email,
        tm.user_id AS member_id,
        member.username AS member_name,
        member.email AS member_email,
        member.role_id AS member_role_id,
        dm.assigned_at AS member_assigned_at
      FROM daos d
      LEFT JOIN users chef ON d.chef_id = chef.id
      LEFT JOIN dao_members dm ON d.id = dm.dao_id
      LEFT JOIN users member ON dm.user_id = member.id
      WHERE d.chef_id = $1

      UNION

      -- Inclure le chef lui-même
      SELECT
        d.id AS dao_id,
        d.numero,
        d.objet,
        d.statut,
        d.created_at,
        chef.username AS chef_name,
        chef.email AS chef_email,
        d.chef_id AS member_id,
        chef.username AS member_name,
        chef.email AS member_email,
        chef.role_id AS member_role_id,
        d.created_at AS member_assigned_at
      FROM daos d
      LEFT JOIN users chef ON d.chef_id = chef.id
      WHERE d.chef_id = $1 AND d.chef_id IS NOT NULL

      ORDER BY dao_id, member_name
      `,
      [Number(chefId)]
    );

    // Organiser les données par DAO
    const teamsMap = new Map();
    
    result.rows.forEach((row: any) => {
      const daoId = row.dao_id;
      
      if (!teamsMap.has(daoId)) {
        teamsMap.set(daoId, {
          dao_id: daoId,
          numero: row.numero,
          objet: row.objet,
          statut: row.statut,
          created_at: row.created_at,
          chef_name: row.chef_name,
          chef_email: row.chef_email,
          members: []
        });
      }
      
      // Ajouter le membre s'il n'est pas déjà dans la liste
      const team = teamsMap.get(daoId);
      if (row.member_id && !team.members.find((m: any) => m.id === row.member_id)) {
        team.members.push({
          id: row.member_id,
          username: row.member_name,
          email: row.member_email,
          role_id: row.member_role_id,
          assigned_at: row.member_assigned_at
        });
      }
    });

    const teams = Array.from(teamsMap.values());

    console.log(`Équipes trouvées pour le chef ${chefId}: ${teams.length} DAOs`);

    res.status(200).json({
      success: true,
      data: {
        teams,
        total_daos: teams.length
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des équipes du chef:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des équipes du chef"
    });
  }
}
