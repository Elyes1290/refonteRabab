<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'];
$dbname = $_ENV['DB_NAME'] ?? $_SERVER['DB_NAME'];
$username = $_ENV['DB_USER'] ?? $_SERVER['DB_USER'];
$password = $_ENV['DB_PASS'] ?? $_SERVER['DB_PASS'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
    exit;
} 