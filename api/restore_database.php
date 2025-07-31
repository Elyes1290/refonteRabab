<?php
// Script de restauration de la base de données
// Usage: php restore_database.php [nom_du_fichier_backup]

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

$backup_dir = __DIR__ . '/backups/';

// Vérification des arguments
if ($argc < 2) {
    echo "Usage: php restore_database.php [nom_du_fichier_backup]\n";
    echo "Exemple: php restore_database.php backup_2024-01-15_14-30-00.sql.gz\n\n";
    
    // Liste des sauvegardes disponibles
    $files = glob($backup_dir . 'backup_*.sql.gz');
    if (empty($files)) {
        echo "Aucune sauvegarde trouvée dans {$backup_dir}\n";
        exit(1);
    }
    
    echo "Sauvegardes disponibles:\n";
    foreach ($files as $file) {
        $filename = basename($file);
        $size = filesize($file);
        $date = date('Y-m-d H:i:s', filemtime($file));
        echo "- {$filename} ({$size} bytes, {$date})\n";
    }
    exit(1);
}

$backup_file = $backup_dir . $argv[1];

// Vérification que le fichier existe
if (!file_exists($backup_file)) {
    echo "Erreur: Le fichier {$backup_file} n'existe pas.\n";
    exit(1);
}

echo "Restauration de la base de données depuis {$backup_file}...\n";

// Décompression du fichier
$temp_file = $backup_dir . 'temp_restore.sql';
$gz = gzopen($backup_file, 'r');
$sql_content = '';
while (!gzeof($gz)) {
    $sql_content .= gzread($gz, 4096);
}
gzclose($gz);
file_put_contents($temp_file, $sql_content);

// Commande de restauration
$command = "mysql --host={$db_host} --user={$db_user} --password={$db_pass} {$db_name} < {$temp_file}";

// Exécution de la restauration
$output = [];
$return_var = 0;
exec($command, $output, $return_var);

// Nettoyage du fichier temporaire
unlink($temp_file);

if ($return_var === 0) {
    echo "Restauration réussie !\n";
    
    // Log de succès
    $log_message = date('Y-m-d H:i:s') . " - Restauration réussie depuis: {$backup_file}\n";
    file_put_contents($backup_dir . 'restore.log', $log_message, FILE_APPEND);
} else {
    echo "Erreur lors de la restauration.\n";
    
    // Log d'erreur
    $log_message = date('Y-m-d H:i:s') . " - Erreur de restauration depuis: {$backup_file}\n";
    file_put_contents($backup_dir . 'restore.log', $log_message, FILE_APPEND);
}
?> 