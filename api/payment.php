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

function ensureStripePaymentLinksTable() {
    try {
        $pdo = getPDO();
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS stripe_payment_links (
              id INT AUTO_INCREMENT PRIMARY KEY,
              reservation_id INT NOT NULL,
              stripe_session_id VARCHAR(255) DEFAULT NULL,
              stripe_payment_intent_id VARCHAR(255) NOT NULL,
              amount_cents INT NOT NULL DEFAULT 0,
              amount_refunded_cents INT NOT NULL DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              UNIQUE KEY uniq_stripe_payment_intent (stripe_payment_intent_id),
              INDEX idx_stripe_payment_links_reservation (reservation_id)
            )
        ");
    } catch (Exception $e) {
        error_log('Erreur table stripe_payment_links: ' . $e->getMessage());
    }
}

function linkStripePaymentToReservation($reservationId, $sessionId, $paymentIntentId, $amountCents) {
    if (!$reservationId || empty($paymentIntentId)) {
        return;
    }
    try {
        ensureStripePaymentLinksTable();
        $pdo = getPDO();
        $stmt = $pdo->prepare("
            INSERT INTO stripe_payment_links
              (reservation_id, stripe_session_id, stripe_payment_intent_id, amount_cents, amount_refunded_cents)
            VALUES (?, ?, ?, ?, 0)
            ON DUPLICATE KEY UPDATE
              reservation_id = VALUES(reservation_id),
              stripe_session_id = VALUES(stripe_session_id),
              amount_cents = VALUES(amount_cents),
              updated_at = NOW()
        ");
        $stmt->execute([
            intval($reservationId),
            $sessionId ?: null,
            $paymentIntentId,
            max(0, intval($amountCents))
        ]);
    } catch (Exception $e) {
        error_log('Erreur liaison paiement Stripe: ' . $e->getMessage());
    }
}

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

// ✅ SÉCURITÉ : Validation de la clé Stripe (test/live avec fallback robuste)
$getEnvValue = function($name) {
    $raw = $_ENV[$name] ?? ($_SERVER[$name] ?? getenv($name) ?? '');
    return trim((string)$raw);
};
$startsWith = function($haystack, $prefix) {
    return strpos((string)$haystack, (string)$prefix) === 0;
};

$stripeModeRaw = strtolower($getEnvValue('STRIPE_MODE'));
$stripeKeyTest = $getEnvValue('STRIPE_SECRET_KEY_TEST');
$stripeKeyLive = $getEnvValue('STRIPE_SECRET_KEY');
$webhookSecretTest = $getEnvValue('STRIPE_WEBHOOK_SECRET_TEST');
$webhookSecretLive = $getEnvValue('STRIPE_WEBHOOK_SECRET');

if (!in_array($stripeModeRaw, ['test', 'live'], true)) {
    // Auto: priorité test si une clé test valide est présente, sinon live
    $stripeModeRaw = $startsWith($stripeKeyTest, 'sk_test_') ? 'test' : 'live';
}

$isStripeTestMode = $stripeModeRaw === 'test';
$stripeKey = $isStripeTestMode ? $stripeKeyTest : $stripeKeyLive;
$stripeWebhookSecret = $isStripeTestMode ? $webhookSecretTest : $webhookSecretLive;

// Fallback si la clé du mode choisi n'est pas valide
if (!$startsWith($stripeKey, 'sk_')) {
    if ($isStripeTestMode && $startsWith($stripeKeyLive, 'sk_live_')) {
        $isStripeTestMode = false;
        $stripeKey = $stripeKeyLive;
        $stripeWebhookSecret = $webhookSecretLive;
    } elseif (!$isStripeTestMode && $startsWith($stripeKeyTest, 'sk_test_')) {
        $isStripeTestMode = true;
        $stripeKey = $stripeKeyTest;
        $stripeWebhookSecret = $webhookSecretTest;
    }
}

if (!$stripeKey || (!$startsWith($stripeKey, 'sk_test_') && !$startsWith($stripeKey, 'sk_live_'))) {
    error_log('SÉCURITÉ: Clé Stripe invalide ou manquante');
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Configuration Stripe invalide: clé secrète manquante ou incorrecte'
    ]);
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
            'success_url' => 'https://www.rababali.com/rendez-vous-et-contact?success=1',
            'cancel_url' => 'https://www.rababali.com/rendez-vous-et-contact',
            'metadata' => [
                'nom' => $reservation['nom'],
                'email' => $reservation['email'],
                'tel' => $reservation['tel'],
                'message' => $reservation['message'],
                'date' => $reservation['date'],
                'horaire' => $reservation['horaire'],
                'service' => $reservation['service'],
                'duration_minutes' => (string)($reservation['duration_minutes'] ?? 60),
            ],
        ]);
        
        // La réservation est créée uniquement après paiement confirmé (webhook)
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
    if (!empty($stripeWebhookSecret)) {
        $payload = file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        
        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload, $sigHeader, $stripeWebhookSecret
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
        $event = json_decode(file_get_contents('php://input'));
    }

    if (!empty($event) && isset($event->type) && $event->type === 'checkout.session.completed') {
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
                    'duration_minutes' => intval($metadata->duration_minutes ?? 60),
                    'montant' => ($session->amount_total ?? 0) / 100,
                    'notes' => $metadata->message ?? '',
                    'statut' => 'payee_a_confirmer',
                ];
                
                $reservationId = createReservation($reservationData);
                linkStripePaymentToReservation(
                    $reservationId,
                    $session->id ?? null,
                    $session->payment_intent ?? null,
                    intval($session->amount_total ?? 0)
                );
                
                // Envoyer l'email de notification
                if ($reservationId) {
                    try {
                        sendReservationPendingConfirmationEmail($reservationData);
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

// Remboursement Stripe depuis l'admin
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'refund-reservation') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            echo json_encode(['success' => false, 'message' => 'Données JSON invalides']);
            exit;
        }

        $reservationId = intval($input['reservation_id'] ?? 0);
        if ($reservationId <= 0) {
            echo json_encode(['success' => false, 'message' => 'reservation_id invalide']);
            exit;
        }

        ensureStripePaymentLinksTable();
        $pdo = getPDO();
        $stmt = $pdo->prepare("
            SELECT stripe_payment_intent_id, amount_cents, amount_refunded_cents
            FROM stripe_payment_links
            WHERE reservation_id = ?
            ORDER BY id DESC
            LIMIT 1
        ");
        $stmt->execute([$reservationId]);
        $paymentLink = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$paymentLink || empty($paymentLink['stripe_payment_intent_id'])) {
            echo json_encode(['success' => false, 'message' => 'Paiement Stripe introuvable pour ce rendez-vous']);
            exit;
        }

        $paymentIntentId = $paymentLink['stripe_payment_intent_id'];
        $amountCents = intval($paymentLink['amount_cents'] ?? 0);
        $alreadyRefundedCents = intval($paymentLink['amount_refunded_cents'] ?? 0);
        $remaining = max(0, $amountCents - $alreadyRefundedCents);
        if ($remaining <= 0) {
            echo json_encode(['success' => false, 'message' => 'Ce paiement a déjà été remboursé']);
            exit;
        }

        $requestedAmount = intval($input['amount_cents'] ?? 0);
        $refundAmount = $requestedAmount > 0 ? min($requestedAmount, $remaining) : $remaining;

        $refund = $stripe->refunds->create([
            'payment_intent' => $paymentIntentId,
            'amount' => $refundAmount
        ]);

        $newRefunded = $alreadyRefundedCents + $refundAmount;
        $upPayment = $pdo->prepare("
            UPDATE stripe_payment_links
            SET amount_refunded_cents = ?, updated_at = NOW()
            WHERE stripe_payment_intent_id = ?
        ");
        $upPayment->execute([$newRefunded, $paymentIntentId]);

        // Si remboursement total, marquer le RDV annulé
        if ($newRefunded >= $amountCents) {
            $upReservation = $pdo->prepare("UPDATE reservations SET statut = 'annulee' WHERE id = ?");
            $upReservation->execute([$reservationId]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Remboursement effectué avec succès',
            'data' => [
                'refund_id' => $refund->id ?? null,
                'amount_refunded_cents' => $refundAmount,
                'fully_refunded' => $newRefunded >= $amountCents
            ]
        ]);
        exit;
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erreur remboursement: ' . $e->getMessage()]);
        exit;
    }
}

// Si aucune action reconnue
http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
exit; 