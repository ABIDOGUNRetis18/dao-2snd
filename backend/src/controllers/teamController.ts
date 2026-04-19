import { Request, Response } from 'express';
import { query } from '../utils/database';

export async function getDaoTeamMembers(req: Request, res: Response) {
  try {
    const { daoId } = req.params;
    console.log('API getDaoTeamMembers appelée pour DAO ID:', daoId);

    // Vérifier que le DAO existe
    const daoResult = await query(
      'SELECT id, chef_id FROM daos WHERE id = $1',
      [daoId]
    );

    if (daoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "DAO non trouvé",
      });
    }

    // Récupérer tous les membres de l'équipe du DAO (chef + membres assignés)
    // 1. D'abord récupérer le chef du DAO
    const chefResult = await query(
      `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role_id,
        u.url_photo,
        true as is_chef,
        0 as chef_order
      FROM users u
      WHERE u.id = (SELECT chef_id FROM daos WHERE id = $1)
      `,
      [daoId]
    );

    // 2. Ensuite récupérer les membres de l'équipe depuis dao_members
    const membersResult = await query(
      `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role_id,
        u.url_photo,
        false as is_chef,
        1 as chef_order
      FROM users u
      INNER JOIN dao_members dm ON u.id = dm.user_id
      WHERE dm.dao_id = $1
        AND u.id != (SELECT chef_id FROM daos WHERE id = $1) -- Éviter les doublons avec le chef
        AND u.role_id IN (1, 2, 3, 4, 5) -- Inclure tous les rôles sauf les comptes système
      ORDER BY u.username
      `,
      [daoId]
    );

    // 3. Combiner les résultats
    const teamResult = {
      rows: [...chefResult.rows, ...membersResult.rows]
    };

    console.log('Résultat de la requête membres:', teamResult.rows.length, 'membres trouvés');
    console.log('Membres:', JSON.stringify(teamResult.rows, null, 2));

    res.status(200).json({
      success: true,
      data: {
        members: teamResult.rows,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des membres de l'équipe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des membres de l'équipe",
    });
  }
}

export async function addTeamMember(req: Request, res: Response) {
  try {
    const { daoId } = req.params;
    const { userId } = req.body;

    // Vérifier que le DAO existe
    const daoResult = await query(
      'SELECT id FROM daos WHERE id = $1',
      [daoId]
    );

    if (daoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "DAO non trouvé",
      });
    }

    // Vérifier que l'utilisateur existe et a un rôle valide
    const userResult = await query(
      'SELECT id, username, role_id FROM users WHERE id = $1 AND role_id IN (1, 2, 3, 4, 5)',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé ou rôle non autorisé",
      });
    }

    // Ajouter le membre à l'équipe du DAO
    await query(
      'INSERT INTO dao_members (dao_id, user_id) VALUES ($1, $2) ON CONFLICT (dao_id, user_id) DO NOTHING',
      [daoId, userId]
    );

    res.status(200).json({
      success: true,
      message: "Membre ajouté à l'équipe avec succès",
      data: {
        member: userResult.rows[0]
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du membre à l'équipe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'ajout du membre à l'équipe",
    });
  }
}

export async function removeTeamMember(req: Request, res: Response) {
  try {
    const { daoId, userId } = req.params;

    // Supprimer le membre de l'équipe du DAO
    const result = await query(
      'DELETE FROM dao_members WHERE dao_id = $1 AND user_id = $2 RETURNING *',
      [daoId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Membre non trouvé dans l'équipe",
      });
    }

    res.status(200).json({
      success: true,
      message: "Membre retiré de l'équipe avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du retrait du membre de l'équipe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors du retrait du membre de l'équipe",
    });
  }
}
