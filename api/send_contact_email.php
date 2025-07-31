<?php
// Charger toutes les dépendances via Composer (PHPMailer + Dotenv)
require_once 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Headers pour CORS et JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier que c'est bien une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    // Charger les variables d'environnement
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();

    // Récupérer les données du formulaire
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Données JSON invalides');
    }

    // Validation des champs requis
    $nom = trim($data['nom'] ?? '');
    $email = trim($data['email'] ?? '');
    $sujet = trim($data['sujet'] ?? '');
    $message = trim($data['message'] ?? '');

    if (empty($nom) || empty($email) || empty($sujet) || empty($message)) {
        throw new Exception('Tous les champs sont obligatoires');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Adresse email invalide');
    }

    // Configuration PHPMailer
    $mail = new PHPMailer(true);

    // Configuration SMTP pour Infomaniak (paramètres officiels)
    $mail->isSMTP();
    $mail->Host = $_ENV['SMTP_HOST'] ?? 'mail.infomaniak.com';
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['SMTP_USERNAME'] ?? '';
    $mail->Password = $_ENV['SMTP_PASSWORD'] ?? '';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    
    // Debug SMTP pour diagnostiquer (temporaire)
    $mail->SMTPDebug = 1; // Afficher les erreurs SMTP
    $mail->Debugoutput = function($str, $level) {
        error_log("SMTP Debug: $str");
    };
    $mail->CharSet = 'UTF-8';

    // Destinataires
    $mail->setFrom($_ENV['SMTP_FROM_EMAIL'] ?? $email, $_ENV['SMTP_FROM_NAME'] ?? 'Site Rabab Ali');
    $mail->addAddress($_ENV['CONTACT_EMAIL'] ?? 'rabab@rababali.com', 'Rabab Ali');
    $mail->addReplyTo($email, $nom);

    // Contenu du mail
    $mail->isHTML(true);
    $mail->Subject = "Nouveau message de contact : " . $sujet;
    
    $mailBody = "
    <html>
    <head><meta charset='UTF-8'></head>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
            <h2 style='color: #8B4513; border-bottom: 2px solid #8B4513; padding-bottom: 10px;'>
                📬 Nouveau message de contact
            </h2>
            
            <div style='background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <p><strong>👤 Nom :</strong> " . htmlspecialchars($nom) . "</p>
                <p><strong>📧 Email :</strong> <a href='mailto:" . htmlspecialchars($email) . "'>" . htmlspecialchars($email) . "</a></p>
                <p><strong>📋 Sujet :</strong> " . htmlspecialchars($sujet) . "</p>
                <p><strong>🕒 Date :</strong> " . date('d/m/Y à H:i') . "</p>
            </div>
            
            <div style='background: white; padding: 20px; border-left: 4px solid #8B4513; margin: 20px 0;'>
                <h3 style='margin-top: 0; color: #8B4513;'>💬 Message :</h3>
                <p style='white-space: pre-wrap;'>" . htmlspecialchars($message) . "</p>
            </div>
            
            <div style='background: #f0f8ff; padding: 15px; border-radius: 5px; margin-top: 20px;'>
                <p style='margin: 0; font-size: 14px; color: #666;'>
                    ✨ Ce message a été envoyé depuis le formulaire de contact de <strong>rababali.com</strong>
                </p>
            </div>
        </div>
    </body>
    </html>";
    
    $mail->Body = $mailBody;

    // Version texte alternative
    $mail->AltBody = "Nouveau message de contact\n\n" .
                     "Nom: $nom\n" .
                     "Email: $email\n" .
                     "Sujet: $sujet\n" .
                     "Date: " . date('d/m/Y à H:i') . "\n\n" .
                     "Message:\n$message\n\n" .
                     "Envoyé depuis rababali.com";

    // Envoyer l'email
    $mail->send();

    // Réponse de succès
    echo json_encode([
        'success' => true,
        'message' => 'Votre message a bien été envoyé. Merci pour votre prise de contact !'
    ]);

} catch (Exception $e) {
    // Log de l'erreur (optionnel)
    error_log("Erreur envoi email contact: " . $e->getMessage());
    
    // Réponse d'erreur
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.',
        'debug' => $e->getMessage() // À supprimer en production
    ]);
}
?>