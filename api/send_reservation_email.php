<?php
// Script d'envoi d'email pour les nouvelles réservations payées
// Utilisé uniquement pour les réservations via la page "Prendre rendez-vous"

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

function sendReservationNotificationEmail($reservationData) {
    // Configuration email depuis les variables d'environnement
    $smtpHost = $_ENV['SMTP_HOST'] ?? 'mail.infomaniak.com';
    $smtpUsername = $_ENV['SMTP_USERNAME'] ?? 'rabab@rababali.com';
    $smtpPassword = $_ENV['SMTP_PASSWORD'] ?? '';
    $fromEmail = $_ENV['SMTP_FROM_EMAIL'] ?? 'rabab@rababali.com';
    $fromName = $_ENV['SMTP_FROM_NAME'] ?? 'Site Rabab Ali';
    $toEmail = $_ENV['CONTACT_EMAIL'] ?? 'rabab@rababali.com';
    $clientEmail = $reservationData['email'] ?? '';
    
    // Formatage des données
    $nomComplet = $reservationData['prenom'] . ' ' . $reservationData['nom'];
    $serviceType = $reservationData['service_type'] === 'seance_online' ? 'Séance en ligne' : 'Séance présentielle';
    $montant = number_format($reservationData['montant'], 2, ',', ' ') . ' CHF';
    $dateFormatted = date('d/m/Y', strtotime($reservationData['date_reservation']));
    
    // Sujet de l'email pour Rabab
    $subjectRabab = "Nouvelle réservation confirmée - {$nomComplet}";
    
    // Corps de l'email pour Rabab
    $messageRabab = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #4682B4; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .reservation-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #4682B4; }
            .highlight { font-weight: bold; color: #4682B4; }
            .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>🎉 Nouvelle réservation confirmée !</h2>
        </div>
        
        <div class='content'>
            <p>Bonjour Rabab,</p>
            
            <p>Une nouvelle réservation a été confirmée et payée sur ton site :</p>
            
            <div class='reservation-details'>
                <h3>📋 Détails de la réservation</h3>
                <p><span class='highlight'>Nom :</span> {$nomComplet}</p>
                <p><span class='highlight'>Email :</span> {$reservationData['email']}</p>
                <p><span class='highlight'>Téléphone :</span> {$reservationData['telephone']}</p>
                <p><span class='highlight'>Service :</span> {$serviceType}</p>
                <p><span class='highlight'>Date :</span> {$dateFormatted}</p>
                <p><span class='highlight'>Heure :</span> {$reservationData['heure_reservation']}</p>
                <p><span class='highlight'>Montant :</span> {$montant}</p>
            </div>
            
            <div class='reservation-details'>
                <h3>💬 Message du client</h3>
                <p>" . nl2br(htmlspecialchars($reservationData['notes'] ?? 'Aucun message')) . "</p>
            </div>
            
            <p>Cette réservation a été automatiquement ajoutée à ton calendrier d'administration.</p>
            
            <p>À bientôt !<br>
            <em>Ton site web</em></p>
        </div>
        
        <div class='footer'>
            <p>Cet email a été envoyé automatiquement par le système de réservation de rababali.com</p>
        </div>
    </body>
    </html>";
    
    // Sujet de l'email pour la cliente
    $subjectClient = "Confirmation de votre réservation - Rabab Ali";
    
    // Corps de l'email pour la cliente
    $messageClient = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #4682B4; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .reservation-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #4682B4; }
            .highlight { font-weight: bold; color: #4682B4; }
            .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .cta { background-color: #4682B4; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>🎉 Votre réservation est confirmée !</h2>
        </div>
        
        <div class='content'>
            <p>Bonjour {$reservationData['prenom']},</p>
            
            <p>Merci pour votre réservation ! Votre séance d'accompagnement est confirmée.</p>
            
            <div class='reservation-details'>
                <h3>📋 Détails de votre réservation</h3>
                <p><span class='highlight'>Nom :</span> {$nomComplet}</p>
                <p><span class='highlight'>Service :</span> {$serviceType}</p>
                <p><span class='highlight'>Date :</span> {$dateFormatted}</p>
                <p><span class='highlight'>Heure :</span> {$reservationData['heure_reservation']}</p>
                <p><span class='highlight'>Montant payé :</span> {$montant}</p>
            </div>
            
            <div class='cta'>
                <h3>📞 Contact</h3>
                <p>Pour toute question, contactez Rabab :</p>
                <p><strong>Email :</strong> rabab@rababali.com</p>
                <p><strong>Site :</strong> rababali.com</p>
            </div>
            
            <p><strong>À très bientôt pour votre séance !</strong></p>
            
            <p>Cordialement,<br>
            <em>Rabab Ali</em></p>
        </div>
        
        <div class='footer'>
            <p>Cet email a été envoyé automatiquement par le système de réservation de rababali.com</p>
        </div>
    </body>
    </html>";
    
    // Headers pour l'email HTML
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . $fromName . ' <' . $fromEmail . '>',
        'Reply-To: ' . $fromEmail,
        'X-Mailer: PHP/' . phpversion()
    ];
    
    // Envoi de l'email à Rabab
    $mailSentRabab = mail($toEmail, $subjectRabab, $messageRabab, implode("\r\n", $headers));
    
    // Envoi de l'email à la cliente (si email valide)
    $mailSentClient = false;
    if (!empty($clientEmail) && filter_var($clientEmail, FILTER_VALIDATE_EMAIL)) {
        $mailSentClient = mail($clientEmail, $subjectClient, $messageClient, implode("\r\n", $headers));
    }
    
    // Log de l'envoi
    $logMessage = date('Y-m-d H:i:s') . " - Email réservation envoyé à {$toEmail} pour {$nomComplet} - " . ($mailSentRabab ? 'SUCCÈS' : 'ÉCHEC') . "\n";
    if (!empty($clientEmail)) {
        $logMessage .= date('Y-m-d H:i:s') . " - Email confirmation envoyé à {$clientEmail} pour {$nomComplet} - " . ($mailSentClient ? 'SUCCÈS' : 'ÉCHEC') . "\n";
    }
    file_put_contents(__DIR__ . '/email_log.txt', $logMessage, FILE_APPEND);
    
    return $mailSentRabab && $mailSentClient;
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