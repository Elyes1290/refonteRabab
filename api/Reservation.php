<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

function getPDO() {
    $host = $_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'];
    $dbname = $_ENV['DB_NAME'] ?? $_SERVER['DB_NAME'];
    $username = $_ENV['DB_USER'] ?? $_SERVER['DB_USER'];
    $password = $_ENV['DB_PASS'] ?? $_SERVER['DB_PASS'];
    return new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
}

function createReservation($data) {
    $pdo = getPDO();
    static $statusColumnEnsured = false;
    if (!$statusColumnEnsured) {
        try {
            $pdo->exec("ALTER TABLE reservations MODIFY COLUMN statut VARCHAR(64) NOT NULL DEFAULT 'en_attente'");
        } catch (PDOException $e) {
            // Non bloquant
        }
        $statusColumnEnsured = true;
    }
    $durationMinutes = isset($data['duration_minutes']) ? intval($data['duration_minutes']) : 60;
    if (!in_array($durationMinutes, [60, 90], true)) {
        $durationMinutes = 60;
    }
    $stmt = $pdo->prepare(
        "INSERT INTO reservations (nom, prenom, email, telephone, service_type, date_reservation, heure_reservation, duration_minutes, statut, montant, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
    );
    
    $stmt->execute([
        $data['nom'],
        $data['prenom'],
        $data['email'],
        $data['telephone'],
        $data['service_type'],
        $data['date_reservation'],
        $data['heure_reservation'],
        $durationMinutes,
        $data['statut'] ?? 'en_attente',
        $data['montant'],
        $data['notes'] ?? ''
    ]);
    return $pdo->lastInsertId();
}

function checkAvailability($date, $heure, $serviceType) {
    $pdo = getPDO();
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as count FROM reservations WHERE date_reservation = ? AND heure_reservation = ? AND service_type = ? AND statut != 'annulee'"
    );
    $stmt->execute([$date, $heure, $serviceType]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row['count'] == 0;
}

function checkReservationExists($email, $date, $heure, $serviceType) {
    $pdo = getPDO();
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as count FROM reservations WHERE email = ? AND date_reservation = ? AND heure_reservation = ? AND service_type = ? AND statut != 'annulee'"
    );
    $stmt->execute([$email, $date, $heure, $serviceType]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row['count'] > 0;
} 