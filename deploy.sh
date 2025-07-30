#!/bin/bash

# Script de déploiement pour Infomaniak
# Usage: ./deploy.sh

echo "🚀 Déploiement du site Rabab Ali sur Infomaniak..."

# Configuration
REMOTE_HOST="rababali.com"
REMOTE_USER="elyesnaitliman"
REMOTE_PATH="/home/elyesnaitliman/public_html/rabab"
BACKEND_PATH="/home/elyesnaitliman/public_html/rabab/backend"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Build du frontend
print_message "Building du frontend..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Erreur lors du build du frontend"
    exit 1
fi

# Créer le dossier de déploiement
print_message "Préparation des fichiers de déploiement..."
mkdir -p deploy
cp -r dist/* deploy/
cp -r backend deploy/

# Créer le fichier .htaccess pour le frontend
cat > deploy/.htaccess << 'EOF'
RewriteEngine On

# Redirection vers index.html pour le SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]

# Headers de sécurité
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Compression GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache pour les fichiers statiques
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
EOF

# Créer le script d'installation du backend
cat > deploy/install_backend.sh << 'EOF'
#!/bin/bash

echo "🔧 Installation du backend..."

# Aller dans le dossier backend
cd backend

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install --production

# Créer le dossier logs
mkdir -p logs

# Vérifier si PM2 est installé
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installation de PM2..."
    npm install -g pm2
fi

# Démarrer l'application avec PM2
echo "🚀 Démarrage de l'application..."
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer le démarrage automatique
pm2 startup

echo "✅ Backend installé et démarré avec succès!"
echo "📊 Statut: pm2 status"
echo "📋 Logs: pm2 logs rabab-backend"
EOF

chmod +x deploy/install_backend.sh

# Créer le fichier de configuration pour Infomaniak
cat > deploy/README_DEPLOIEMENT.md << 'EOF'
# Déploiement sur Infomaniak

## 1. Upload des fichiers
- Uploadez tous les fichiers du dossier `deploy/` dans le dossier `rabab/` sur votre hébergement Infomaniak

## 2. Configuration du backend
Connectez-vous en SSH à votre hébergement et exécutez :

```bash
cd rabab
chmod +x install_backend.sh
./install_backend.sh
```

## 3. Configuration des variables d'environnement
Créez le fichier `.env` dans le dossier `backend/` avec vos paramètres :

```
DB_HOST=votre-host.infomaniak.com
DB_USER=votre-utilisateur
DB_PASSWORD=votre-mot-de-passe
DB_NAME=votre-base-de-donnees
DB_PORT=3306
PORT=3001
NODE_ENV=production
JWT_SECRET=votre-cle-secrete
CORS_ORIGIN=https://rababali.com
```

## 4. Vérification
- Frontend : https://rababali.com/rabab/
- API : https://rababali.com/rabab/api/health

## 5. Maintenance
```bash
# Redémarrer le backend
pm2 restart rabab-backend

# Voir les logs
pm2 logs rabab-backend

# Statut
pm2 status
```
EOF

print_message "✅ Fichiers de déploiement créés dans le dossier 'deploy/'"
print_message "📁 Contenu du dossier deploy/:"
ls -la deploy/

print_message ""
print_message "📋 Prochaines étapes :"
print_message "1. Uploadez le contenu du dossier 'deploy/' dans le dossier 'rabab/' sur Infomaniak"
print_message "2. Connectez-vous en SSH et exécutez : cd rabab && ./install_backend.sh"
print_message "3. Configurez le fichier .env dans le dossier backend/"
print_message "4. Vérifiez que tout fonctionne : https://rababali.com/rabab/"

# Nettoyer
print_message "🧹 Nettoyage..."
rm -rf deploy

print_message "🎉 Déploiement terminé !" 