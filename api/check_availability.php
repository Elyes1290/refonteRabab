<?php
require_once __DIR__ . '/Reservation.php';

header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $date = $data['date'] ?? '';
    $heure = $data['heure'] ?? '';
    $service = $data['service'] ?? '';
    $available = checkAvailability($date, $heure, $service);
    echo json_encode(['success' => true, 'available' => $available]);
} 