# Backend DAO 2SND

Backend Node.js + TypeScript + SQLite pour l'application de gestion des DAO.

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev

# Compiler pour la production
npm run build

# Démarrer en mode production
npm start
```

## Configuration

Les variables d'environnement sont définies dans le fichier `.env` :

- `PORT`: Port du serveur (défaut: 3001)
- `JWT_SECRET`: Clé secrète pour les tokens JWT
- `JWT_EXPIRES_IN`: Durée d'expiration des tokens (défaut: 7d)
- `DB_PATH`: Chemin vers la base de données SQLite

## Utilisateurs par défaut

Lors du premier démarrage, les utilisateurs suivants sont créés automatiquement :

| Username | Email | Mot de passe | Rôle |
|----------|-------|-------------|------|
| admin | admin@dao.com | admin123 | admin |
| jdupont | jean.dupont@dao.com | directeur123 | directeur |
| mmartin | marie.martin@dao.com | chef123 | chef_projet |
| pdurand | pierre.durand@dao.com | membre123 | membre_equipe |
| sbernard | sophie.bernard@dao.com | lecteur123 | lecteur |

## API Endpoints

### Authentification

- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur (authentifié)
- `POST /api/auth/logout` - Déconnexion (authentifié)

### Test

- `GET /api/test` - Route de test

## Structure du projet

```
backend/
├── src/
│   ├── controllers/    # Logique métier
│   ├── middleware/     # Middlewares (authentification, etc.)
│   ├── models/         # Modèles de base de données
│   ├── routes/         # Routes API
│   ├── utils/          # Utilitaires (JWT, etc.)
│   └── app.ts          # Fichier principal
├── database.sqlite     # Base de données SQLite
├── .env               # Variables d'environnement
└── package.json       # Dépendances et scripts
```

## Sécurité

- Mots de passe hashés avec bcryptjs
- Tokens JWT pour l'authentification
- Validation des entrées
- CORS configuré pour le frontend
