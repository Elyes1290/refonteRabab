<?php
// Fichier dédié au flux ICS - aucun header JSON, aucune dépendance externe
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Charger les variables d'environnement
try {
    require_once __DIR__ . '/vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    http_response_code(500);
    exit;
}

$host     = $_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'] ?? '';
$dbname   = $_ENV['DB_NAME'] ?? $_SERVER['DB_NAME'] ?? '';
$username = $_ENV['DB_USER'] ?? $_SERVER['DB_USER'] ?? '';
$password = $_ENV['DB_PASS'] ?? $_SERVER['DB_PASS'] ?? '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    exit;
}

$stmt = $pdo->query("
    SELECT id, nom, prenom, service_type, date_reservation, heure_reservation,
           COALESCE(duration_minutes, 60) AS duration_minutes
    FROM reservations
    WHERE statut NOT IN ('annulee', 'refuse')
    ORDER BY date_reservation ASC, heure_reservation ASC
");
$reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Supprime les accents pour compatibilité maximale avec les parseurs stricts
function removeAccents($str) {
    $from = ['à','â','ä','é','è','ê','ë','î','ï','ô','ö','ù','û','ü','ç','À','Â','Ä','É','È','Ê','Ë','Î','Ï','Ô','Ö','Ù','Û','Ü','Ç'];
    $to   = ['a','a','a','e','e','e','e','i','i','o','o','u','u','u','c','A','A','A','E','E','E','E','I','I','O','O','U','U','U','C'];
    return str_replace($from, $to, $str);
}

// Echappe les caractères spéciaux ICS (RFC 5545)
function escapeIcs($value) {
    $v = str_replace('\\', '\\\\', (string)$value);
    $v = str_replace(';', '\;', $v);
    $v = str_replace(',', '\,', $v);
    $v = str_replace("\r\n", '\n', $v);
    $v = str_replace("\n", '\n', $v);
    return $v;
}

// Découpe les lignes à 75 octets max (RFC 5545 §3.1)
function foldLine($line) {
    $result = '';
    $lineBytes = 0;
    $isFirst = true;
    $chars = preg_split('//u', $line, -1, PREG_SPLIT_NO_EMPTY);
    foreach ($chars as $char) {
        $charBytes = strlen($char);
        $limit = $isFirst ? 75 : 74;
        if ($lineBytes + $charBytes > $limit) {
            $result .= "\r\n ";
            $lineBytes = 1;
            $isFirst = false;
        }
        $result .= $char;
        $lineBytes += $charBytes;
    }
    return $result;
}

$output  = foldLine('BEGIN:VCALENDAR') . "\r\n";
$output .= foldLine('VERSION:2.0') . "\r\n";
$output .= foldLine('PRODID:-//RababAli//RDV//FR') . "\r\n";
$output .= foldLine('CALSCALE:GREGORIAN') . "\r\n";
$output .= foldLine('METHOD:PUBLISH') . "\r\n";
$output .= foldLine('X-WR-CALNAME:Rendez-vous Rabab Ali') . "\r\n";

foreach ($reservations as $row) {
    $date = trim($row['date_reservation'] ?? '');
    $time = trim($row['heure_reservation'] ?? '');
    if ($date === '' || $time === '') continue;

    try {
        $tz  = new DateTimeZone('Europe/Zurich');
        $utc = new DateTimeZone('UTC');

        $start = new DateTime($date . ' ' . substr($time, 0, 5), $tz);
        $duration = intval($row['duration_minutes'] ?? 60);
        if (!in_array($duration, [60, 90], true)) $duration = 60;

        $end = clone $start;
        $end->modify('+' . $duration . ' minutes');

        // Convertir en UTC — format universel, aucun VTIMEZONE requis
        $start->setTimezone($utc);
        $end->setTimezone($utc);
        $now = new DateTime('now', $utc);

        $service = $row['service_type'] ?? '';
        if ($service === 'seance_online')      $service = 'Seance en ligne';
        elseif ($service === 'seance_presentiel') $service = 'Seance en presentiel';
        elseif ($service === 'seance_domicile')   $service = 'Seance a domicile';
        else $service = 'Seance';

        $clientName = trim(removeAccents(($row['prenom'] ?? '') . ' ' . ($row['nom'] ?? '')));
        $summary    = $clientName !== '' ? $service . ' - ' . $clientName : $service;
        $uid        = 'rabab-' . intval($row['id']) . '@rababali.com';

        $output .= foldLine('BEGIN:VEVENT') . "\r\n";
        $output .= foldLine('UID:' . $uid) . "\r\n";
        $output .= foldLine('DTSTAMP:' . $now->format('Ymd\THis\Z')) . "\r\n";
        $output .= foldLine('DTSTART:' . $start->format('Ymd\THis\Z')) . "\r\n";
        $output .= foldLine('DTEND:' . $end->format('Ymd\THis\Z')) . "\r\n";
        $output .= foldLine('SUMMARY:' . escapeIcs($summary)) . "\r\n";
        $output .= foldLine('STATUS:CONFIRMED') . "\r\n";
        $output .= foldLine('END:VEVENT') . "\r\n";
    } catch (Exception $e) {
        // Ignorer les entrées invalides
    }
}

$output .= foldLine('END:VCALENDAR') . "\r\n";

// Envoyer les headers APRÈS avoir construit tout le contenu (évite tout header prématuré)
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/calendar; charset=utf-8');
header('Content-Disposition: attachment; filename="rendez-vous-rabab.ics"');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Content-Length: ' . strlen($output));

echo $output;
exit;
