<?php
// Script de sauvegarde spécifique pour Infomaniak Cron
// Accepte les appels HTTP d'Infomaniak

// Chargement des variables d'environnement
require_once __DIR__ . '/vendor/autoload.php';

// Charger le fichier .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Configuration depuis les variables d'environnement
$db_host = $_ENV['DB_HOST'] ?? 'localhost';
$db_name = $_ENV['DB_NAME'] ?? 'rababali_db';
$db_user = $_ENV['DB_USER'] ?? 'root';
$db_pass = $_ENV['DB_PASS'] ?? '';

// Dossier de sauvegarde
$backup_dir = __DIR__ . '/backups/';
if (!is_dir($backup_dir)) {
    mkdir($backup_dir, 0755, true);
}

// Nom du fichier de sauvegarde avec timestamp
$timestamp = date('Y-m-d_H-i-s');
$backup_file = $backup_dir . 'backup_' . $timestamp . '.sql';

// Commande mysqldump
$command = "mysqldump --host={$db_host} --user={$db_user} --password={$db_pass} {$db_name} > {$backup_file}";

// Exécution de la sauvegarde
$output = [];
$return_var = 0;
exec($command, $output, $return_var);

if ($return_var === 0) {
    // Compression du fichier
    $compressed_file = $backup_file . '.gz';
    $gz = gzopen($compressed_file, 'w9');
    gzwrite($gz, file_get_contents($backup_file));
    gzclose($gz);
    
    // Suppression du fichier non compressé
    unlink($backup_file);
    
    // Nettoyage des anciennes sauvegardes (garde les 7 derniers jours)
    $files = glob($backup_dir . 'backup_*.sql.gz');
    $cutoff = time() - (7 * 24 * 60 * 60); // 7 jours
    
    foreach ($files as $file) {
        if (filemtime($file) < $cutoff) {
            unlink($file);
        }
    }
    
    // Log de succès
    $log_message = date('Y-m-d H:i:s') . " - Sauvegarde réussie: {$compressed_file}\n";
    file_put_contents($backup_dir . 'backup.log', $log_message, FILE_APPEND);
    
    echo "Sauvegarde réussie: {$compressed_file}";
} else {
    // Log d'erreur
    $log_message = date('Y-m-d H:i:s') . " - Erreur de sauvegarde\n";
    file_put_contents($backup_dir . 'backup.log', $log_message, FILE_APPEND);
    
    echo "Erreur lors de la sauvegarde";
}
?> 