<?php
// Afficher les erreurs pour debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    require_once 'vendor/autoload.php';
    
    // Charger les variables d'environnement
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de chargement: ' . $e->getMessage()
    ]);
    exit;
}

// Debug : vérifier les variables d'environnement
$googleApiKey = $_ENV['VITE_GOOGLE_API_KEY'] ?? '';
$placeId = $_ENV['VITE_GOOGLE_PLACE_ID'] ?? '';

// Debug temporaire - supprimer après test
error_log("Google API Key length: " . strlen($googleApiKey));
error_log("Place ID: " . $placeId);

if (empty($googleApiKey) || empty($placeId)) {
    echo json_encode([
        'success' => false,
        'message' => 'Configuration Google manquante',
        'debug' => [
            'api_key_length' => strlen($googleApiKey),
            'place_id' => $placeId ?: 'vide',
            'env_vars' => array_keys($_ENV)
        ]
    ]);
    exit;
}

try {
    // Appel à l'API Google Places
    $url = "https://maps.googleapis.com/maps/api/place/details/json?" . http_build_query([
        'place_id' => $placeId,
        'fields' => 'name,rating,reviews,user_ratings_total',
        'key' => $googleApiKey,
        'language' => 'fr'
    ]);

    // Utiliser cURL car allow_url_fopen=0 sur Infomaniak
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Compatible Bot)');
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($response === false || !empty($curlError)) {
        throw new Exception('Erreur cURL: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        throw new Exception('Code HTTP: ' . $httpCode);
    }

    $data = json_decode($response, true);

    if ($data['status'] === 'OK') {
        echo json_encode([
            'success' => true,
            'data' => $data['result']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur API Google: ' . $data['status'],
            'error' => $data['error_message'] ?? ''
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>