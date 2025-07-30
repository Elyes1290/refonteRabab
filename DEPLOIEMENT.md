# 🚀 Déploiement du site Rabab Ali sur Infomaniak

## 📋 Vue d'ensemble

Ce projet comprend :

- **Frontend** : Site React avec Vite (pages d'accueil, Vision 3D, réservation)
- **Backend** : API Node.js/Express pour gérer les réservations
- **Base de données** : MySQL sur Infomaniak

## 🛠️ Prérequis

### Sur votre machine locale :

- Node.js (version 18+)
- npm ou yarn
- Git

### Sur Infomaniak :

- Hébergement web avec support Node.js
- Base de données MySQL
- Accès SSH

## 📦 Installation locale

```bash
# Cloner le projet
git clone <url-du-repo>
cd RefonteSiteRabab

# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev
```

## 🗄️ Configuration de la base de données

### 1. Créer la table de réservations

Connectez-vous à votre base de données MySQL sur Infomaniak et exécutez :

```sql
CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  service_type ENUM('seance_online', 'seance_presentiel') NOT NULL,
  date_reservation DATE NOT NULL,
  heure_reservation TIME NOT NULL,
  statut ENUM('en_attente', 'confirmee', 'annulee', 'terminee') DEFAULT 'en_attente',
  montant DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Noter les paramètres de connexion

Notez ces informations depuis votre panneau Infomaniak :

- **Host** : `votre-host.infomaniak.com`
- **Utilisateur** : `votre-utilisateur`
- **Mot de passe** : `votre-mot-de-passe`
- **Base de données** : `votre-base-de-donnees`
- **Port** : `3306` (généralement)

## 🚀 Déploiement automatique

### Option 1 : Script automatique (recommandé)

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh
```

Le script va :

1. Builder le frontend
2. Créer un dossier `deploy/` avec tous les fichiers
3. Préparer les scripts d'installation

### Option 2 : Déploiement manuel

```bash
# Builder le frontend
npm run build

# Créer le dossier de déploiement
mkdir deploy
cp -r dist/* deploy/
cp -r backend deploy/
```

## 📤 Upload sur Infomaniak

### 1. Upload des fichiers

Uploadez le contenu du dossier `deploy/` dans le dossier `rabab/` sur votre hébergement Infomaniak.

Structure finale sur le serveur :

```
/home/elyesnaitliman/public_html/rabab/
├── index.html
├── assets/
├── .htaccess
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── ecosystem.config.js
├── install_backend.sh
└── README_DEPLOIEMENT.md
```

### 2. Configuration du backend

Connectez-vous en SSH à votre hébergement :

```bash
# Aller dans le dossier du projet
cd /home/elyesnaitliman/public_html/rabab

# Rendre le script d'installation exécutable
chmod +x install_backend.sh

# Lancer l'installation
./install_backend.sh
```

### 3. Configuration des variables d'environnement

Créez le fichier `.env` dans le dossier `backend/` :

```bash
cd backend
nano .env
```

Contenu du fichier `.env` :

```env
# Configuration de la base de données MySQL (Infomaniak)
DB_HOST=votre-host.infomaniak.com
DB_USER=votre-utilisateur
DB_PASSWORD=votre-mot-de-passe
DB_NAME=votre-base-de-donnees
DB_PORT=3306

# Configuration du serveur
PORT=3001
NODE_ENV=production

# Clé secrète pour JWT (à changer en production)
JWT_SECRET=votre-super-secret-jwt-key-change-this-in-production

# Configuration CORS
CORS_ORIGIN=https://rababali.com
```

### 4. Redémarrer le backend

```bash
# Redémarrer l'application
pm2 restart rabab-backend

# Vérifier le statut
pm2 status

# Voir les logs
pm2 logs rabab-backend
```

## ✅ Vérification

### 1. Frontend

- **URL** : https://rababali.com/rabab/
- **Vérifier** : Pages d'accueil, Vision 3D, formulaire de réservation

### 2. API Backend

- **Health check** : https://rababali.com/rabab/api/health
- **Réservations** : https://rababali.com/rabab/api/reservations

### 3. Test de réservation

1. Aller sur la page de réservation
2. Sélectionner une séance en ligne
3. Choisir une date (mercredi ou samedi)
4. Sélectionner un créneau
5. Remplir le formulaire
6. Vérifier que la réservation est créée

## 🔧 Maintenance

### Commandes utiles

```bash
# Voir le statut de l'application
pm2 status

# Voir les logs en temps réel
pm2 logs rabab-backend --lines 100

# Redémarrer l'application
pm2 restart rabab-backend

# Arrêter l'application
pm2 stop rabab-backend

# Supprimer l'application de PM2
pm2 delete rabab-backend
```

### Mise à jour du code

```bash
# 1. Uploader les nouveaux fichiers
# 2. Redémarrer le backend
pm2 restart rabab-backend

# 3. Vérifier les logs
pm2 logs rabab-backend
```

### Sauvegarde de la base de données

```bash
# Depuis votre machine locale
mysqldump -h votre-host.infomaniak.com -u votre-utilisateur -p votre-base-de-donnees > backup_$(date +%Y%m%d).sql
```

## 🐛 Dépannage

### Problèmes courants

#### 1. Erreur de connexion à la base de données

```bash
# Vérifier les paramètres dans .env
cd backend
cat .env

# Tester la connexion
node -e "
const mysql = require('mysql2/promise');
const config = require('dotenv').config();
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
pool.getConnection().then(() => console.log('✅ Connexion OK')).catch(console.error);
"
```

#### 2. L'API ne répond pas

```bash
# Vérifier que PM2 fonctionne
pm2 status

# Voir les logs d'erreur
pm2 logs rabab-backend --err

# Redémarrer si nécessaire
pm2 restart rabab-backend
```

#### 3. Erreurs CORS

- Vérifier que `CORS_ORIGIN` dans `.env` correspond à votre domaine
- Vérifier que le frontend fait bien les appels vers la bonne URL

#### 4. Problèmes de permissions

```bash
# Donner les bonnes permissions
chmod 755 /home/elyesnaitliman/public_html/rabab
chmod 644 /home/elyesnaitliman/public_html/rabab/.htaccess
```

## 📞 Support

En cas de problème :

1. Vérifier les logs : `pm2 logs rabab-backend`
2. Tester l'API : `curl https://rababali.com/rabab/api/health`
3. Vérifier la base de données
4. Contacter le support Infomaniak si nécessaire

## 🔒 Sécurité

### Recommandations

- Changer la clé JWT_SECRET en production
- Utiliser HTTPS partout
- Limiter l'accès à la base de données
- Surveiller les logs régulièrement
- Faire des sauvegardes régulières

### Variables d'environnement sensibles

- `DB_PASSWORD` : Mot de passe de la base de données
- `JWT_SECRET` : Clé secrète pour les tokens
- Ne jamais commiter ces valeurs dans Git

---

**🎉 Félicitations ! Votre site est maintenant déployé et fonctionnel !**
