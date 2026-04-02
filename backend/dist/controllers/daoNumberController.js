"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextDaoNumber = getNextDaoNumber;
exports.getDaoTypes = getDaoTypes;
exports.addDaoType = addDaoType;
const database_1 = require("../utils/database");
async function getNextDaoNumber(req, res) {
    try {
        console.log("=== RÉCUPÉRATION PROCHAIN NUMÉRO DAO - DÉBUT ===");
        const year = new Date().getFullYear();
        // 1. Récupérer le dernier numéro pour cette année (prévisualisation)
        const result = await (0, database_1.query)(`SELECT numero FROM daos 
       WHERE numero LIKE $1 
       ORDER BY numero DESC 
       LIMIT 1`, [`DAO-${year}-%`]);
        let nextSeq = 1;
        let lastNumber = "";
        if (result.rows.length > 0) {
            const lastNumero = result.rows[0].numero;
            console.log("Dernier numéro trouvé:", lastNumero);
            // Extraire le numéro séquentiel avec regex
            const match = lastNumero.match(new RegExp(`DAO-${year}-(\\d+)`));
            if (match && match[1]) {
                lastNumber = match[1];
                nextSeq = parseInt(match[1]) + 1;
            }
        }
        // 2. Générer le numéro de prévisualisation
        const generatedNumero = `DAO-${year}-${String(nextSeq).padStart(3, "0")}`;
        console.log("Année:", year);
        console.log("Dernier numéro:", lastNumber || "Aucun");
        console.log("Prochain séquence:", nextSeq);
        console.log("Numéro généré (prévisualisation):", generatedNumero);
        console.log("=== RÉCUPÉRATION PROCHAIN NUMÉRO DAO - TERMINÉ ===");
        res.json({
            success: true,
            numero: generatedNumero,
            year: year,
            sequence: nextSeq,
            lastNumber: lastNumber
        });
    }
    catch (error) {
        console.error('Erreur lors de la génération du numéro DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la génération du numéro DAO'
        });
    }
}
async function getDaoTypes(req, res) {
    try {
        const result = await (0, database_1.query)(`SELECT code, libelle, description FROM dao_types ORDER BY code`);
        res.json({
            success: true,
            data: result.rows
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
async function addDaoType(req, res) {
    try {
        const { code, libelle, description } = req.body;
        if (!code || !libelle) {
            return res.status(400).json({
                success: false,
                message: 'Le code et le libellé sont requis'
            });
        }
        const result = await (0, database_1.query)(`INSERT INTO dao_types (code, libelle, description) 
       VALUES ($1, $2, $3) RETURNING *`, [code.toUpperCase(), libelle, description || null]);
        res.status(201).json({
            success: true,
            message: 'Type de DAO ajouté avec succès',
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Erreur lors de l\'ajout du type de DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'ajout du type de DAO'
        });
    }
}
//# sourceMappingURL=daoNumberController.js.map