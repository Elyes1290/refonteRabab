<?php
require_once __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Configuration CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Répondre aux requêtes preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Vérifier que c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit();
}

try {
    // Récupérer les données JSON
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Validation des champs requis
    $required_fields = ['nom', 'email', 'sujet', 'message'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            throw new Exception("Le champ '$field' est requis");
        }
    }
    
    // Nettoyer les données
    $nom = htmlspecialchars(trim($data['nom']));
    $email = filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL);
    $sujet = htmlspecialchars(trim($data['sujet']));
    $message = htmlspecialchars(trim($data['message']));
    
    if (!$email) {
        throw new Exception("Adresse email invalide");
    }
    
    // Configuration de PHPMailer
    $mail = new PHPMailer(true);
    
    // Configuration SMTP - SÉCURISÉ avec variables d'environnement
    $mail->isSMTP();
    $mail->Host = $_ENV['SMTP_HOST'] ?? $_SERVER['SMTP_HOST'] ?? 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['SMTP_USER'] ?? $_SERVER['SMTP_USER'] ?? ''; // Email d'envoi
    $mail->Password = $_ENV['SMTP_PASS'] ?? $_SERVER['SMTP_PASS'] ?? ''; // Mot de passe d'application
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';
    
    // Configuration de l'email
    $mail->setFrom(
        $_ENV['SMTP_FROM'] ?? $_SERVER['SMTP_FROM'] ?? 'contact@rababali.com',
        'Site Web Rabab'
    );
    $mail->addAddress($_ENV['CONTACT_EMAIL'] ?? $_SERVER['CONTACT_EMAIL'] ?? 'rabab@rababali.com');
    $mail->addReplyTo($email, $nom); // L'email du client pour répondre directement
    
    // Contenu de l'email
    $mail->isHTML(true);
    $mail->Subject = "Nouveau message de contact : $sujet";
    
    $mail->Body = "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <h2 style='color: #4682B4; border-bottom: 2px solid #4682B4; padding-bottom: 10px;'>
            📬 Nouveau message de contact
        </h2>
        
        <div style='background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;'>
            <p><strong>👤 Nom :</strong> $nom</p>
            <p><strong>📧 Email :</strong> $email</p>
            <p><strong>📝 Sujet :</strong> $sujet</p>
        </div>
        
        <div style='background: white; padding: 20px; border-left: 4px solid #4682B4; margin: 20px 0;'>
            <h3 style='margin-top: 0; color: #333;'>💬 Message :</h3>
            <p style='line-height: 1.6; color: #555;'>" . nl2br($message) . "</p>
        </div>
        
        <div style='background: #e8f4f8; padding: 15px; border-radius: 8px; margin-top: 20px;'>
            <p style='margin: 0; font-size: 14px; color: #666;'>
                💡 <strong>Astuce :</strong> Vous pouvez répondre directement à cet email, 
                votre réponse sera envoyée à <strong>$email</strong>
            </p>
        </div>
        
        <footer style='text-align: center; padding: 20px; color: #888; font-size: 12px;'>
            Message envoyé depuis le formulaire de contact de rababali.com
        </footer>
    </div>";
    
    // Version texte alternative
    $mail->AltBody = "Nouveau message de contact\n\n"
                   . "Nom: $nom\n"
                   . "Email: $email\n"
                   . "Sujet: $sujet\n\n"
                   . "Message:\n$message\n\n"
                   . "---\n"
                   . "Message envoyé depuis le formulaire de contact de rababali.com";
    
    // Envoyer l'email
    $mail->send();
    
    echo json_encode([
        'success' => true,
        'message' => 'Votre message a été envoyé avec succès ! Rabab vous répondra rapidement.'
    ]);
    
} catch (Exception $e) {
    error_log("Erreur envoi email: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de l\'envoi du message. Veuillez réessayer ou contacter directement par email.'
    ]);
}
?> 