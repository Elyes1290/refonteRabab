<?php
// Script d'envoi d'email pour les nouvelles réservations payées
// Utilisé uniquement pour les réservations via la page "Prendre rendez-vous"

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

function getReservationMailerConfig() {
    return [
        'resend_api_key' => trim($_ENV['RESEND_API_KEY'] ?? ($_SERVER['RESEND_API_KEY'] ?? '')),
        'from_email' => trim($_ENV['RESEND_FROM_EMAIL'] ?? ($_SERVER['RESEND_FROM_EMAIL'] ?? ($_ENV['SMTP_FROM_EMAIL'] ?? ($_SERVER['SMTP_FROM_EMAIL'] ?? 'onboarding@resend.dev')))),
        'from_name' => trim($_ENV['RESEND_FROM_NAME'] ?? ($_SERVER['RESEND_FROM_NAME'] ?? ($_ENV['SMTP_FROM_NAME'] ?? ($_SERVER['SMTP_FROM_NAME'] ?? 'Site Rabab Ali')))),
        'admin_email' => trim($_ENV['CONTACT_EMAIL'] ?? ($_SERVER['CONTACT_EMAIL'] ?? 'rabab@rababali.com')),
    ];
}

function getReservationMeta($reservationData) {
    $nomComplet = trim(($reservationData['prenom'] ?? '') . ' ' . ($reservationData['nom'] ?? ''));
    $serviceType = ($reservationData['service_type'] ?? '') === 'seance_online' ? 'Séance en ligne' : 'Séance présentielle';
    if (($reservationData['service_type'] ?? '') === 'seance_domicile') {
        $serviceType = 'Séance à domicile';
    }
    $durationMinutes = intval($reservationData['duration_minutes'] ?? 60);
    if (!in_array($durationMinutes, [60, 90], true)) {
        $durationMinutes = 60;
    }
    $montant = number_format(floatval($reservationData['montant'] ?? 0), 2, ',', ' ') . ' CHF';
    $dateFormatted = date('d/m/Y', strtotime($reservationData['date_reservation'] ?? 'now'));
    $heure = $reservationData['heure_reservation'] ?? '';
    return [
        'nom_complet' => $nomComplet,
        'service_type' => $serviceType,
        'duration' => $durationMinutes,
        'montant' => $montant,
        'date' => $dateFormatted,
        'heure' => $heure,
        'email_client' => trim($reservationData['email'] ?? ''),
        'telephone' => trim($reservationData['telephone'] ?? ''),
        'message' => trim($reservationData['notes'] ?? ''),
        'prenom' => trim($reservationData['prenom'] ?? ''),
    ];
}

function sendReservationEmailSmtp($toEmail, $toName, $subject, $htmlBody, $altBody, $replyToEmail = '', $replyToName = '') {
    $cfg = getReservationMailerConfig();
    if ($cfg['resend_api_key'] === '' || $toEmail === '') {
        error_log("Erreur email réservation: RESEND_API_KEY manquante ou destinataire vide");
        return false;
    }

    try {
        $payload = [
            'from' => trim($cfg['from_name']) !== '' ? ($cfg['from_name'] . ' <' . $cfg['from_email'] . '>') : $cfg['from_email'],
            'to' => [trim($toEmail)],
            'subject' => $subject,
            'html' => $htmlBody,
            'text' => $altBody,
        ];
        if ($replyToEmail !== '' && filter_var($replyToEmail, FILTER_VALIDATE_EMAIL)) {
            $payload['reply_to'] = trim($replyToName) !== '' ? ($replyToName . ' <' . $replyToEmail . '>') : $replyToEmail;
        }

        $requestBody = json_encode($payload, JSON_UNESCAPED_UNICODE);
        if ($requestBody === false) {
            return false;
        }

        $statusCode = 0;
        $responseRaw = '';
        if (function_exists('curl_init')) {
            $ch = curl_init('https://api.resend.com/emails');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $cfg['resend_api_key'],
                'Content-Type: application/json',
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            $responseRaw = curl_exec($ch);
            $statusCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($responseRaw === false) {
                error_log('Erreur Resend cURL: ' . curl_error($ch));
            }
            curl_close($ch);
        } else {
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Authorization: Bearer {$cfg['resend_api_key']}\r\nContent-Type: application/json\r\n",
                    'content' => $requestBody,
                    'timeout' => 15,
                ],
            ]);
            $responseRaw = @file_get_contents('https://api.resend.com/emails', false, $context);
            if (isset($http_response_header) && is_array($http_response_header) && isset($http_response_header[0])) {
                if (preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
                    $statusCode = (int)$m[1];
                }
            }
        }

        if ($statusCode >= 200 && $statusCode < 300) {
            return true;
        }

        error_log('Erreur Resend API (status ' . $statusCode . '): ' . ($responseRaw ?: 'no response body'));
        return false;
    } catch (Exception $e) {
        error_log("Erreur Resend réservation: " . $e->getMessage());
        return false;
    }
}

function sendReservationPendingConfirmationEmail($reservationData) {
    $cfg = getReservationMailerConfig();
    $meta = getReservationMeta($reservationData);

    $subjectAdmin = "Nouvelle réservation payée à confirmer - {$meta['nom_complet']}";
    $bodyAdmin = "
    <h2>Nouvelle réservation payée</h2>
    <p>Un client a payé sa séance. Merci de confirmer, annuler ou reporter depuis l'admin.</p>
    <p><strong>Client:</strong> {$meta['nom_complet']}<br>
    <strong>Email:</strong> {$meta['email_client']}<br>
    <strong>Téléphone:</strong> {$meta['telephone']}<br>
    <strong>Service:</strong> {$meta['service_type']} ({$meta['duration']} min)<br>
    <strong>Date:</strong> {$meta['date']} à {$meta['heure']}<br>
    <strong>Montant payé:</strong> {$meta['montant']}</p>
    <p><strong>Message client:</strong><br>" . nl2br(htmlspecialchars($meta['message'] !== '' ? $meta['message'] : 'Aucun message')) . "</p>";
    $altAdmin = "Nouvelle réservation payée à confirmer: {$meta['nom_complet']} - {$meta['date']} {$meta['heure']}";

    $sentAdmin = sendReservationEmailSmtp(
        $cfg['admin_email'],
        'Rabab Ali',
        $subjectAdmin,
        $bodyAdmin,
        $altAdmin,
        $meta['email_client'],
        $meta['nom_complet']
    );

    $sentClient = true;
    if ($meta['email_client'] !== '' && filter_var($meta['email_client'], FILTER_VALIDATE_EMAIL)) {
        $subjectClient = "Paiement reçu - en attente de confirmation";
        $bodyClient = "
        <h2>Merci, votre paiement est bien reçu</h2>
        <p>Bonjour {$meta['prenom']},</p>
        <p>Votre demande de rendez-vous a bien été payée. Rabab va confirmer votre créneau sous peu.</p>
        <p><strong>Créneau demandé:</strong> {$meta['date']} à {$meta['heure']}<br>
        <strong>Service:</strong> {$meta['service_type']} ({$meta['duration']} min)<br>
        <strong>Montant payé:</strong> {$meta['montant']}</p>
        <p>Vous recevrez un email de confirmation (ou de report) après validation.</p>";
        $altClient = "Paiement reçu. Votre réservation est en attente de confirmation.";
        $sentClient = sendReservationEmailSmtp(
            $meta['email_client'],
            $meta['prenom'] !== '' ? $meta['prenom'] : $meta['nom_complet'],
            $subjectClient,
            $bodyClient,
            $altClient,
            $cfg['admin_email'],
            'Rabab Ali'
        );
    }

    return $sentAdmin && $sentClient;
}

function sendReservationDecisionEmail($reservationData, $decisionStatus) {
    $cfg = getReservationMailerConfig();
    $meta = getReservationMeta($reservationData);
    if ($meta['email_client'] === '' || !filter_var($meta['email_client'], FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $decisionLabel = 'mis à jour';
    $subject = "Mise à jour de votre rendez-vous";
    $body = "<h2>Mise à jour de votre rendez-vous</h2>";
    $alt = "Mise à jour de votre rendez-vous";

    if ($decisionStatus === 'confirmee') {
        $decisionLabel = 'confirmé';
        $subject = "Votre rendez-vous est confirmé";
        $body = "
        <h2>Votre rendez-vous est confirmé</h2>
        <p>Bonjour {$meta['prenom']},</p>
        <p>Votre réservation est confirmée pour <strong>{$meta['date']} à {$meta['heure']}</strong>.</p>
        <p><strong>Facture (récapitulatif):</strong><br>
        Service: {$meta['service_type']} ({$meta['duration']} min)<br>
        Montant payé: {$meta['montant']}</p>
        <p>Merci et à très bientôt.</p>";
        $alt = "Rendez-vous confirmé pour {$meta['date']} à {$meta['heure']}. Facture: {$meta['montant']}.";
    } elseif ($decisionStatus === 'annulee') {
        $decisionLabel = 'annulé';
        $subject = "Votre rendez-vous a été annulé";
        $body = "
        <h2>Votre rendez-vous a été annulé</h2>
        <p>Bonjour {$meta['prenom']},</p>
        <p>Votre rendez-vous prévu le <strong>{$meta['date']} à {$meta['heure']}</strong> a été annulé.</p>
        <p>Rabab va vous proposer une nouvelle date de rendez-vous très prochainement.</p>";
        $alt = "Rendez-vous annulé. Une nouvelle date vous sera proposée.";
    } elseif ($decisionStatus === 'reportee') {
        $decisionLabel = 'reporté';
        $subject = "Votre rendez-vous a été reporté";
        $body = "
        <h2>Votre rendez-vous a été reporté</h2>
        <p>Bonjour {$meta['prenom']},</p>
        <p>Suite à votre échange avec Rabab, la nouvelle date proposée est:</p>
        <p><strong>{$meta['date']} à {$meta['heure']}</strong></p>
        <p>Merci de confirmer si ce créneau vous convient.</p>";
        $alt = "Rendez-vous reporté. Nouvelle date: {$meta['date']} {$meta['heure']}.";
    }

    $sentClient = sendReservationEmailSmtp(
        $meta['email_client'],
        $meta['prenom'] !== '' ? $meta['prenom'] : $meta['nom_complet'],
        $subject,
        $body,
        $alt,
        $cfg['admin_email'],
        'Rabab Ali'
    );

    if ($sentClient) {
        $subjectAdmin = "Notification client envoyée ({$decisionLabel}) - {$meta['nom_complet']}";
        $bodyAdmin = "<p>Notification {$decisionLabel} envoyée au client {$meta['nom_complet']} ({$meta['email_client']}).</p>";
        $altAdmin = "Notification client envoyée ({$decisionLabel})";
        sendReservationEmailSmtp($cfg['admin_email'], 'Rabab Ali', $subjectAdmin, $bodyAdmin, $altAdmin);
    }

    return $sentClient;
}

// Compatibilité: ancien nom de fonction
function sendReservationNotificationEmail($reservationData) {
    return sendReservationPendingConfirmationEmail($reservationData);
}

// Fonction pour vérifier si c'est une réservation via le site (pas admin)
function isReservationFromWebsite($reservationData) {
    // On peut identifier les réservations du site par certains critères
    // Par exemple, les réservations admin ont souvent des notes spécifiques
    // ou des montants différents
    
    // Pour l'instant, on envoie l'email pour toutes les réservations confirmées
    // car on ne peut pas facilement distinguer l'origine
    return true;
}
?> 