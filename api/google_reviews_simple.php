<?php
// Version simple sans Composer
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Lire directement le fichier .env
function loadEnvFile($file) {
    $env = [];
    if (file_exists($file)) {
        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue; // Ignorer les commentaires
            list($name, $value) = explode('=', $line, 2);
            $env[trim($name)] = trim($value);
        }
    }
    return $env;
}

try {
    // Charger les variables d'environnement
    $env = loadEnvFile(__DIR__ . '/.env');
    
    $googleApiKey = $env['VITE_GOOGLE_API_KEY'] ?? '';
    $placeId = $env['VITE_GOOGLE_PLACE_ID'] ?? '';
    
    if (empty($googleApiKey) || empty($placeId)) {
        echo json_encode([
            'success' => false,
            'message' => 'Configuration Google manquante',
            'debug' => [
                'env_file_exists' => file_exists(__DIR__ . '/.env'),
                'env_file_path' => __DIR__ . '/.env',
                'api_key_length' => strlen($googleApiKey),
                'api_key_preview' => $googleApiKey ? substr($googleApiKey, 0, 10) . '...' : 'vide',
                'place_id' => $placeId ?: 'vide',
                'all_env_vars' => array_keys($env)
            ]
        ]);
        exit;
    }

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
        // Debug temporaire : voir ce que retourne exactement l'API
        $result = $data['result'];
        $debugInfo = [
            'name' => $result['name'] ?? 'N/A',
            'rating' => $result['rating'] ?? 'N/A',
            'user_ratings_total' => $result['user_ratings_total'] ?? 'N/A',
            'reviews_count' => isset($result['reviews']) ? count($result['reviews']) : 0,
            'has_reviews' => isset($result['reviews']),
            'debug_raw' => $result // Voir toutes les données brutes
        ];
        
        echo json_encode([
            'success' => true,
            'data' => $result,
            'debug' => $debugInfo
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur API Google: ' . $data['status'],
            'error' => $data['error_message'] ?? '',
            'debug_url' => $url
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage(),
        'file' => __FILE__,
        'line' => $e->getLine()
    ]);
}
?>