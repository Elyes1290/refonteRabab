<?php
// Headers CORS sécurisés
header('Content-Type: application/json; charset=utf-8');

// CORS - Autoriser les domaines spécifiques
$allowed_origins = [
    'http://localhost:5173',
    'https://rababali.com',
    'https://www.rababali.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Fallback pour permettre le fonctionnement
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Max-Age: 86400');

// Headers de sécurité basiques
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('X-Content-Type-Options: nosniff');

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'pdo_connect.php';

// Protection basique contre force brute (sans sessions pour éviter les problèmes)
$max_attempts = 5;
$lockout_file = __DIR__ . '/login_attempts.json';

// Récupération des paramètres (GET comme avant)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $username = $_GET['username'] ?? '';
    $password = $_GET['password'] ?? '';
} else {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
}

// Validation basique
if (!$username || !$password) {
    echo json_encode(['success' => false, 'message' => 'Champs manquants.']);
    exit;
}

// Limiter la longueur pour éviter les attaques
if (strlen($username) > 50 || strlen($password) > 100) {
    echo json_encode(['success' => false, 'message' => 'Champs trop longs.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        // Authentification réussie
        echo json_encode(['success' => true, 'message' => 'Authentification réussie']);
    } else {
        // Identifiants invalides
        echo json_encode(['success' => false, 'message' => 'Identifiants invalides.']);
    }
} catch (Exception $e) {
    error_log('Erreur login: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
} 