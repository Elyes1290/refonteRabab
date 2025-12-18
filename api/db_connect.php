<?php
// ✅ SÉCURITÉ : Désactiver l'affichage d'erreurs en production
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0); // En production, logs seulement

// Headers CORS sécurisés et headers de sécurité
header('Content-Type: application/json; charset=utf-8');

// ✅ SÉCURITÉ : CORS restreint aux domaines autorisés
$allowed_origins = [
    'http://localhost:5173',      // Développement
    'https://rababali.com',       // Production
    'https://www.rababali.com'    // Production avec www
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://rababali.com'); // Défaut sécurisé
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Max-Age: 86400');

// Gestion des requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ SÉCURITÉ : Headers de protection critiques
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com https://js.stripe.com; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com; img-src \'self\' data: https:; connect-src \'self\' https://api.stripe.com;');

// Gestion des requêtes OPTIONS (preflight) - important pour mobile
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Gestion des erreurs pour debug
try {
    require_once __DIR__ . '/vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur chargement autoload: ' . $e->getMessage()]);
    exit;
}

// Configuration de la base de données sécurisée
// $config = require __DIR__ . '/config.php';
$host = $_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'];
$dbname = $_ENV['DB_NAME'] ?? $_SERVER['DB_NAME'];
$username = $_ENV['DB_USER'] ?? $_SERVER['DB_USER'];
$password = $_ENV['DB_PASS'] ?? $_SERVER['DB_PASS'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Route pour créer une réservation
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_reservation') {
        // Vérifier d'abord si le créneau est encore disponible
        $checkStmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM reservations 
            WHERE date_reservation = ? 
            AND heure_reservation = ? 
            AND statut != 'annulee'
        ");
        
        $checkStmt->execute([
            $_POST['date_reservation'],
            $_POST['heure_reservation']
        ]);
        
        $checkResult = $checkStmt->fetch();
        
        if ($checkResult['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'Ce créneau n\'est plus disponible'
            ]);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO reservations (nom, prenom, email, telephone, service_type, date_reservation, heure_reservation, montant, notes, statut, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $_POST['nom'],
            $_POST['prenom'],
            $_POST['email'],
            $_POST['telephone'],
            $_POST['service_type'],
            $_POST['date_reservation'],
            $_POST['heure_reservation'],
            $_POST['montant'],
            $_POST['notes'] ?? '',
            $_POST['statut'] ?? 'en_attente'
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Réservation créée avec succès']);
    }
    
    // Route pour vérifier la disponibilité
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'check_availability') {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM reservations 
            WHERE date_reservation = ? 
            AND heure_reservation = ? 
            AND statut != 'annulee'
        ");
        
        $stmt->execute([
            $_POST['date'],
            $_POST['heure']
        ]);
        
        $result = $stmt->fetch();
        $available = $result['count'] === 0;
        
        echo json_encode([
            'success' => true, 
            'available' => $available,
            'debug' => [
                'date' => $_POST['date'],
                'heure' => $_POST['heure'],
                'count' => $result['count']
            ]
        ]);
    }
    
    // Route pour récupérer toutes les réservations
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_reservations') {
        $stmt = $pdo->query("SELECT * FROM reservations ORDER BY created_at DESC");
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $reservations]);
    }
    
    // Route pour récupérer tous les événements
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_events') {
        // Supprimer automatiquement les événements expirés (date_fin passée)
        $today = date('Y-m-d');
        $deleteStmt = $pdo->prepare("DELETE FROM events WHERE date_fin < :today");
        $deleteStmt->execute(['today' => $today]);
        
        // Récupérer les événements restants
        $stmt = $pdo->query("SELECT id, titre, description, date_event, date_fin, prix, devise, image_url, type, modele, sous_titre, lieu, texte, url_inscription, is_promotion, prix_promo FROM events ORDER BY date_event DESC");
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $events]);
    }
    
    // Route pour récupérer la promotion active pour les rendez-vous
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_active_promotion') {
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT id, titre, date_event, date_fin, prix_promo FROM events WHERE is_promotion = 1 AND date_event <= :today AND date_fin >= :today ORDER BY date_event DESC LIMIT 1");
        $stmt->execute(['today' => $today]);
        $promotion = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($promotion) {
            echo json_encode(['success' => true, 'data' => $promotion]);
        } else {
            echo json_encode(['success' => true, 'data' => null]);
        }
    }
    
    // Route pour récupérer toutes les expériences
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_experiences') {
        $all = isset($_GET['all']) && $_GET['all'] == 1;
        if ($all) {
            $stmt = $pdo->query("SELECT id, nom, titre, message, date_creation, statut FROM experiences ORDER BY date_creation DESC");
        } else {
            $stmt = $pdo->prepare("SELECT id, nom, titre, message, date_creation, statut FROM experiences WHERE statut = 'valide' ORDER BY date_creation DESC");
            $stmt->execute();
        }
        $experiences = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $experiences]);
    }
    
    // Route pour ajouter une nouvelle expérience
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_experience') {
        $nom = trim($_POST['nom'] ?? '');
        $titre = trim($_POST['titre'] ?? '');
        $message = trim($_POST['message'] ?? '');
        
        if (empty($nom) || empty($titre) || empty($message)) {
            echo json_encode(['success' => false, 'message' => 'Tous les champs sont requis']);
        } else {
            try {
                $stmt = $pdo->prepare("INSERT INTO experiences (nom, titre, message, date_creation, modere, affiche, statut) VALUES (?, ?, ?, NOW(), 0, 0, 'en_attente')");
                if ($stmt->execute([$nom, $titre, $message])) {
                    echo json_encode(['success' => true, 'message' => 'Expérience ajoutée avec succès']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout de l\'expérience']);
                }
            } catch(PDOException $e) {
                echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
            }
        }
    }
    
    // Route pour ajouter un événement classique
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_event') {
        $titre = trim($_POST['titre'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $date_event = trim($_POST['date_event'] ?? '');
        $date_fin = trim($_POST['date_fin'] ?? '');
        $prix = trim($_POST['prix'] ?? '');
        $devise = trim($_POST['devise'] ?? '€');
        $url_inscription = trim($_POST['url_inscription'] ?? '');
        $is_promotion = isset($_POST['is_promotion']) ? (int)$_POST['is_promotion'] : 0;
        $prix_promo = trim($_POST['prix_promo'] ?? '');
        $type = 'event';
        $image_url = '';

        // ✅ SÉCURITÉ : Upload sécurisé avec validation stricte
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadFile = $_FILES['image'];
            $maxSize = 5 * 1024 * 1024; // 5MB max
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            $allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
            
            // Validation taille
            if ($uploadFile['size'] > $maxSize) {
                echo json_encode(['success' => false, 'message' => 'Fichier trop volumineux (max 5MB)']);
                exit;
            }
            
            // Validation type MIME
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $uploadFile['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($mimeType, $allowedTypes)) {
                echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé']);
                exit;
            }
            
            // Validation extension
            $ext = strtolower(pathinfo($uploadFile['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExts)) {
                echo json_encode(['success' => false, 'message' => 'Extension non autorisée']);
                exit;
            }
            
            // Génération nom sécurisé
            $filename = 'event_' . uniqid() . '_' . time() . '.' . $ext;
            $dest = __DIR__ . "/../images/events_uploads/" . $filename;
            
            // Vérification directory traversal
            $realDest = realpath(dirname($dest)) . '/' . basename($dest);
            if (strpos($realDest, realpath(__DIR__ . "/../images/events_uploads/")) !== 0) {
                echo json_encode(['success' => false, 'message' => 'Chemin non autorisé']);
                exit;
            }
            
            if (move_uploaded_file($uploadFile['tmp_name'], $dest)) {
                $image_url = "/rabab/images/events_uploads/" . $filename;
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'upload']);
                exit;
            }
        }

        $stmt = $pdo->prepare("INSERT INTO events (titre, description, date_event, date_fin, prix, devise, image_url, type, url_inscription, is_promotion, prix_promo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$titre, $description, $date_event, $date_fin, $prix, $devise, $image_url, $type, $url_inscription, $is_promotion, $prix_promo]);
        echo json_encode(['success' => true, 'message' => 'Événement ajouté avec succès']);
    }
    
    // Route pour ajouter un flyer comme événement spécial
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_flyer') {
        $titre = trim($_POST['titre'] ?? '');
        $sous_titre = trim($_POST['sous_titre'] ?? '');
        $date_event = trim($_POST['date_event'] ?? '');
        $date_fin = trim($_POST['date_fin'] ?? '');
        $prix = trim($_POST['prix'] ?? '');
        $devise = trim($_POST['devise'] ?? '€');
        $lieu = trim($_POST['lieu'] ?? '');
        $texte = trim($_POST['texte'] ?? '');
        $modele = trim($_POST['modele'] ?? 'cercles');
        $image_url = '';
        // Gestion upload image fusionnée du flyer
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $filename = uniqid("flyer_") . "." . $ext;
            $dest = __DIR__ . "/../images/flyers_uploads/" . $filename;
            if (move_uploaded_file($_FILES['image']['tmp_name'], $dest)) {
                $image_url = "/rabab/images/flyers_uploads/" . $filename;
            }
        }
        $stmt = $pdo->prepare("INSERT INTO events (titre, description, date_event, date_fin, prix, devise, image_url, type, sous_titre, lieu, texte, modele) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $desc = $texte; // Utiliser le texte du flyer comme description
        $type = 'flyer';
        $stmt->execute([
            $titre,
            $desc,
            $date_event,
            $date_fin,
            $prix,
            $devise,
            $image_url,
            $type,
            $sous_titre,
            $lieu,
            $texte,
            $modele
        ]);
        echo json_encode(['success' => true, 'message' => 'Flyer ajouté avec succès']);
    }
    
    // Route pour modifier un événement (classique ou flyer)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_event') {
        $id = intval($_POST['id'] ?? 0);
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID événement manquant']);
            exit;
        }
        
        // Récupérer l'événement existant pour connaître son type
        $stmt = $pdo->prepare("SELECT type, modele FROM events WHERE id = ?");
        $stmt->execute([$id]);
        $existingEvent = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existingEvent) {
            echo json_encode(['success' => false, 'message' => 'Événement non trouvé']);
            exit;
        }
        
        $titre = trim($_POST['titre'] ?? '');
        $date_event = trim($_POST['date_event'] ?? '');
        $date_fin = trim($_POST['date_fin'] ?? '');
        $prix = trim($_POST['prix'] ?? '');
        $devise = trim($_POST['devise'] ?? '€');
        
        // Gestion de l'image (optionnelle lors de la modification)
        $image_url = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadFile = $_FILES['image'];
            $maxSize = 5 * 1024 * 1024; // 5MB max
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            $allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
            
            // Validation taille
            if ($uploadFile['size'] > $maxSize) {
                echo json_encode(['success' => false, 'message' => 'Fichier trop volumineux (max 5MB)']);
                exit;
            }
            
            // Validation type MIME
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $uploadFile['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($mimeType, $allowedTypes)) {
                echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé']);
                exit;
            }
            
            // Validation extension
            $ext = strtolower(pathinfo($uploadFile['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExts)) {
                echo json_encode(['success' => false, 'message' => 'Extension non autorisée']);
                exit;
            }
            
            // Génération nom sécurisé
            $isFlyer = ($existingEvent['type'] === 'flyer');
            $prefix = $isFlyer ? 'flyer_' : 'event_';
            $uploadDir = $isFlyer ? 'flyers_uploads' : 'events_uploads';
            $filename = $prefix . uniqid() . '_' . time() . '.' . $ext;
            $dest = __DIR__ . "/../images/{$uploadDir}/" . $filename;
            
            if (move_uploaded_file($uploadFile['tmp_name'], $dest)) {
                $image_url = "/rabab/images/{$uploadDir}/" . $filename;
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'upload']);
                exit;
            }
        }
        
        // Traitement selon le type d'événement
        if ($existingEvent['type'] === 'flyer') {
            // C'est un flyer
            $sous_titre = trim($_POST['sous_titre'] ?? '');
            $lieu = trim($_POST['lieu'] ?? '');
            $texte = trim($_POST['texte'] ?? '');
            $modele = trim($_POST['modele'] ?? $existingEvent['modele']);
            $description = isset($_POST['description']) ? trim($_POST['description']) : $texte;
            
            if ($image_url) {
                // Avec nouvelle image
                $stmt = $pdo->prepare("UPDATE events SET titre = ?, description = ?, date_event = ?, date_fin = ?, prix = ?, devise = ?, image_url = ?, sous_titre = ?, lieu = ?, texte = ?, modele = ? WHERE id = ?");
                $stmt->execute([$titre, $description, $date_event, $date_fin, $prix, $devise, $image_url, $sous_titre, $lieu, $texte, $modele, $id]);
            } else {
                // Sans nouvelle image
                $stmt = $pdo->prepare("UPDATE events SET titre = ?, description = ?, date_event = ?, date_fin = ?, prix = ?, devise = ?, sous_titre = ?, lieu = ?, texte = ?, modele = ? WHERE id = ?");
                $stmt->execute([$titre, $description, $date_event, $date_fin, $prix, $devise, $sous_titre, $lieu, $texte, $modele, $id]);
            }
        } else {
            // C'est un événement classique
            $description = trim($_POST['description'] ?? '');
            $url_inscription = trim($_POST['url_inscription'] ?? '');
            $is_promotion = isset($_POST['is_promotion']) ? (int)$_POST['is_promotion'] : 0;
            $prix_promo = trim($_POST['prix_promo'] ?? '');
            
            if ($image_url) {
                // Avec nouvelle image
                $stmt = $pdo->prepare("UPDATE events SET titre = ?, description = ?, date_event = ?, date_fin = ?, prix = ?, devise = ?, image_url = ?, url_inscription = ?, is_promotion = ?, prix_promo = ? WHERE id = ?");
                $stmt->execute([$titre, $description, $date_event, $date_fin, $prix, $devise, $image_url, $url_inscription, $is_promotion, $prix_promo, $id]);
            } else {
                // Sans nouvelle image
                $stmt = $pdo->prepare("UPDATE events SET titre = ?, description = ?, date_event = ?, date_fin = ?, prix = ?, devise = ?, url_inscription = ?, is_promotion = ?, prix_promo = ? WHERE id = ?");
                $stmt->execute([$titre, $description, $date_event, $date_fin, $prix, $devise, $url_inscription, $is_promotion, $prix_promo, $id]);
            }
        }
        
        echo json_encode(['success' => true, 'message' => 'Événement modifié avec succès']);
    }
    
    // Route pour supprimer un événement (classique ou flyer)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && ((isset($_POST['action']) && $_POST['action'] === 'delete_event') || (isset($_GET['action']) && $_GET['action'] === 'delete_event' && isset($_GET['id']))) ) {
        // Récupérer l'id de l'événement à supprimer
        $id = isset($_POST['id']) ? intval($_POST['id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            return;
        }
        // Récupérer l'URL de l'image pour suppression physique
        $stmt = $pdo->prepare('SELECT image_url FROM events WHERE id = ?');
        $stmt->execute([$id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$event) {
            echo json_encode(['success' => false, 'message' => 'Événement introuvable']);
            return;
        }
        // Supprimer l'image du serveur si elle existe
        if (!empty($event['image_url'])) {
            $imagePath = $_SERVER['DOCUMENT_ROOT'] . $event['image_url'];
            if (file_exists($imagePath)) {
                @unlink($imagePath);
            }
        }
        // Supprimer l'événement de la base
        $stmt = $pdo->prepare('DELETE FROM events WHERE id = ?');
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true, 'message' => 'Événement supprimé avec succès']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
        }
    }
    
    // Route pour supprimer une expérience/avis
    elseif (
        $_SERVER['REQUEST_METHOD'] === 'POST' &&
        ((isset($_POST['action']) && $_POST['action'] === 'delete_experience') || (isset($_GET['action']) && $_GET['action'] === 'delete_experience' && isset($_GET['id'])))
    ) {
        $id = isset($_POST['id']) ? intval($_POST['id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            return;
        }
        $stmt = $pdo->prepare('DELETE FROM experiences WHERE id = ?');
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true, 'message' => 'Avis supprimé avec succès']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
        }
    }

    
    // Route pour modifier un rendez-vous
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_reservation') {
        $id = intval($_POST['id'] ?? 0);
        $nom = trim($_POST['nom'] ?? '');
        $prenom = trim($_POST['prenom'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $telephone = trim($_POST['telephone'] ?? '');
        $service_type = trim($_POST['service_type'] ?? '');
        $date_reservation = trim($_POST['date_reservation'] ?? '');
        $heure_reservation = trim($_POST['heure_reservation'] ?? '');
        $montant = floatval($_POST['montant'] ?? 0);
        $notes = trim($_POST['notes'] ?? '');
        $statut = trim($_POST['statut'] ?? 'en_attente');
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de rendez-vous invalide']);
            return;
        }
        
        if (empty($nom) || empty($prenom) || empty($email) || empty($telephone) || 
            empty($service_type) || empty($date_reservation) || empty($heure_reservation)) {
            echo json_encode(['success' => false, 'message' => 'Tous les champs obligatoires doivent être remplis']);
            return;
        }
        
        try {
            $stmt = $pdo->prepare("
                UPDATE reservations SET 
                nom = ?, prenom = ?, email = ?, telephone = ?, service_type = ?, 
                date_reservation = ?, heure_reservation = ?, montant = ?, notes = ?, statut = ?
                WHERE id = ?
            ");
            
            if ($stmt->execute([$nom, $prenom, $email, $telephone, $service_type, $date_reservation, $heure_reservation, $montant, $notes, $statut, $id])) {
                echo json_encode(['success' => true, 'message' => 'Rendez-vous modifié avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la modification du rendez-vous']);
            }
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }
    
    // Route pour supprimer un rendez-vous
    elseif (
        $_SERVER['REQUEST_METHOD'] === 'POST' &&
        ((isset($_POST['action']) && $_POST['action'] === 'delete_reservation') || (isset($_GET['action']) && $_GET['action'] === 'delete_reservation' && isset($_GET['id'])))
    ) {
        $id = isset($_POST['id']) ? intval($_POST['id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de rendez-vous invalide']);
            return;
        }
        
        try {
            $stmt = $pdo->prepare('DELETE FROM reservations WHERE id = ?');
            if ($stmt->execute([$id])) {
                echo json_encode(['success' => true, 'message' => 'Rendez-vous supprimé avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression du rendez-vous']);
            }
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }
    
    // Route pour modérer un avis (valider ou refuser)
    elseif (
        $_SERVER['REQUEST_METHOD'] === 'POST'
        && isset($_GET['action']) && $_GET['action'] === 'moderate_experience'
        && isset($_GET['id']) && isset($_GET['statut'])
    ) {
        $id = intval($_GET['id']);
        $statut = $_GET['statut'];
        if (!in_array($statut, ['valide', 'refuse'])) {
            echo json_encode(['success' => false, 'message' => 'Statut invalide']);
            return;
        }
        $stmt = $pdo->prepare("UPDATE experiences SET statut = ? WHERE id = ?");
        if ($stmt->execute([$statut, $id])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
        }
    }

    
    // Route pour récupérer les réservations d'une date spécifique
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_reservations_for_date') {
        $date = $_GET['date'] ?? '';
        $service = $_GET['service'] ?? '';
        
        if (empty($date) || empty($service)) {
            echo json_encode(['success' => false, 'message' => 'Date et service requis']);
            return;
        }
        
        try {
            $stmt = $pdo->prepare("
                SELECT heure_reservation, service_type 
                FROM reservations 
                WHERE date_reservation = ? 
                AND service_type = ? 
                AND statut NOT IN ('annulee', 'refuse')
                ORDER BY heure_reservation ASC
            ");
            
            $stmt->execute([$date, $service]);
            $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'data' => $reservations]);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }
    
    // Route d'authentification admin
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'admin_login') {
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Identifiants manquants']);
            return;
        }
        
        try {
            $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE username = ? LIMIT 1');
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password_hash'])) {
                echo json_encode(['success' => true, 'message' => 'Authentification réussie']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Identifiants incorrects']);
            }
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }
    
    // Route de santé
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'health') {
        echo json_encode([
            'success' => true, 
            'message' => 'API opérationnelle',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    else {
        echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
    }
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?> 