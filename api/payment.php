<?php
// ✅ SÉCURITÉ : Désactiver debug en production
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();
require_once __DIR__ . '/Reservation.php';
require_once __DIR__ . '/send_reservation_email.php';

// ✅ Fonction helper pour séparer prénom et nom correctement
function separerPrenomNom($nomComplet) {
    $parties = explode(' ', trim($nomComplet));
    if (count($parties) <= 1) {
        // Si un seul mot, on considère que c'est le prénom
        return [
            'prenom' => $nomComplet,
            'nom' => $nomComplet
        ];
    }
    
    $prenom = $parties[0]; // Premier mot = prénom
    $nom = implode(' ', array_slice($parties, 1)); // Reste = nom de famille
    
    return [
        'prenom' => $prenom,
        'nom' => $nom
    ];
}

// Configuration CORS sécurisée
$allowed_origins = [
    'http://localhost:5173',      // Développement
    'https://rababali.com',       // Production
    'https://www.rababali.com',   // Production avec www
    'http://rababali.com',        // Production HTTP (si besoin)
    'http://www.rababali.com'     // Production HTTP avec www (si besoin)
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    
    // ✅ SÉCURITÉ : Headers de protection
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('X-Content-Type-Options: nosniff');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// ✅ SÉCURITÉ : Validation de la clé Stripe
$stripeKey = $_ENV['STRIPE_SECRET_KEY'] ?? $_SERVER['STRIPE_SECRET_KEY'];
if (!$stripeKey || (!str_starts_with($stripeKey, 'sk_test_') && !str_starts_with($stripeKey, 'sk_live_'))) {
    error_log('SÉCURITÉ: Clé Stripe invalide ou manquante');
    http_response_code(500);
    exit;
}

$stripe = new \Stripe\StripeClient($stripeKey);

header('Content-Type: application/json');

// Créer une session de paiement Stripe
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'create-checkout-session') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            echo json_encode(['success' => false, 'message' => 'Données JSON invalides']);
            exit;
        }
        $amount = $data['amount'];
        $description = $data['description'];
        $reservation = $data['reservation'];

        $session = $stripe->checkout->sessions->create([
            // payment_method_types omis = Stripe détecte automatiquement toutes les méthodes activées
            'line_items' => [[
                'price_data' => [
                    'currency' => 'chf',
                    'product_data' => ['name' => $description],
                    'unit_amount' => $amount,
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
                    'success_url' => 'https://www.rababali.com/rendez-vous?success=1',
        'cancel_url' => 'https://www.rababali.com/rendez-vous',
            'metadata' => [
                'nom' => $reservation['nom'],
                'email' => $reservation['email'],
                'tel' => $reservation['tel'],
                'message' => $reservation['message'],
                'date' => $reservation['date'],
                'horaire' => $reservation['horaire'],
                'service' => $reservation['service'],
            ],
        ]);
        
        // Pour les tests : créer immédiatement la réservation avec statut "confirmee"
        // En production, cela sera fait par le webhook
        if (strpos($_ENV['STRIPE_SECRET_KEY'] ?? $_SERVER['STRIPE_SECRET_KEY'], 'sk_test_') === 0) {
            try {
                $reservationData = [
                    'nom' => separerPrenomNom($reservation['nom'])['nom'],
                    'prenom' => separerPrenomNom($reservation['nom'])['prenom'],
                    'email' => $reservation['email'],
                    'telephone' => $reservation['tel'],
                    'service_type' => $reservation['service'],
                    'date_reservation' => $reservation['date'],
                    'heure_reservation' => $reservation['horaire'],
                    'montant' => $amount / 100,
                    'notes' => $reservation['message'],
                    'statut' => 'confirmee',
                ];
                
                $reservationId = createReservation($reservationData);
                
                // Envoyer l'email de notification (même en test)
                if ($reservationId) {
                    try {
                        sendReservationNotificationEmail($reservationData);
                    } catch (Exception $e) {
                        error_log("Erreur envoi email réservation TEST: " . $e->getMessage());
                    }
                }
            } catch (Exception $e) {
                error_log("Erreur création réservation TEST: " . $e->getMessage());
            }
        }
        
        echo json_encode(['success' => true, 'url' => $session->url]);
        exit;
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erreur Stripe: ' . $e->getMessage()]);
        exit;
    }
}

// Webhook Stripe
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'webhook') {
    // Vérification de la signature webhook (recommandé en production)
    if (isset($_SERVER['STRIPE_WEBHOOK_SECRET'])) {
        $payload = file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        
        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload, $sigHeader, $_SERVER['STRIPE_WEBHOOK_SECRET']
            );
        } catch(\UnexpectedValueException $e) {
            error_log('Invalid payload: ' . $e->getMessage());
            http_response_code(400);
            exit();
        } catch(\Stripe\Exception\SignatureVerificationException $e) {
            error_log('Invalid signature: ' . $e->getMessage());
            http_response_code(400);
            exit();
        }
    } else {
        // Fallback si pas de secret webhook configuré
        $event = json_decode(file_get_contents('php://input'), true);
    }

    if ($event->type === 'checkout.session.completed') {
        $session = $event->data->object;
        $metadata = $session->metadata;
        
        // Vérifier si la réservation existe déjà pour éviter les doublons
        $email = $metadata->email ?? '';
        $date = $metadata->date ?? '';
        $horaire = $metadata->horaire ?? '';
        $service = $metadata->service ?? '';
        
        if (!checkReservationExists($email, $date, $horaire, $service)) {
            try {
                $reservationData = [
                    'nom' => separerPrenomNom($metadata->nom ?? '')['nom'],
                    'prenom' => separerPrenomNom($metadata->nom ?? '')['prenom'],
                    'email' => $email,
                    'telephone' => $metadata->tel ?? '',
                    'service_type' => $service,
                    'date_reservation' => $date,
                    'heure_reservation' => $horaire,
                    'montant' => ($session->amount_total ?? 0) / 100,
                    'notes' => $metadata->message ?? '',
                    'statut' => 'confirmee',
                ];
                
                $reservationId = createReservation($reservationData);
                
                // Envoyer l'email de notification
                if ($reservationId) {
                    try {
                        sendReservationNotificationEmail($reservationData);
                    } catch (Exception $e) {
                        error_log("Erreur envoi email réservation: " . $e->getMessage());
                    }
                }
            } catch (Exception $e) {
                error_log("Erreur création réservation: " . $e->getMessage());
            }
        }
    }
    echo json_encode(['received' => true]);
    exit;
}

// Si aucune action reconnue
http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
exit; 