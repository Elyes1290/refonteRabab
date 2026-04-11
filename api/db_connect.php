<?php
// ✅ SÉCURITÉ : Désactiver l'affichage d'erreurs en production
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0); // En production, logs seulement

// Headers CORS sécurisés et headers de sécurité
header('Content-Type: application/json; charset=utf-8');

// ✅ SÉCURITÉ : CORS restreint aux domaines autorisés
$allowed_origins = [
    'http://localhost:5173',      // Développement
    'https://rababali.com',       // Production
    'https://www.rababali.com'    // Production avec www
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://rababali.com'); // Défaut sécurisé
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Max-Age: 86400');

// Gestion des requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ SÉCURITÉ : Headers de protection critiques
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com https://js.stripe.com; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com; img-src \'self\' data: https:; connect-src \'self\' https://api.stripe.com;');

// Gestion des requêtes OPTIONS (preflight) - important pour mobile
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Gestion des erreurs pour debug
try {
    require_once __DIR__ . '/vendor/autoload.php';
    require_once __DIR__ . '/send_reservation_email.php';
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur chargement autoload: ' . $e->getMessage()]);
    exit;
}

// Configuration de la base de données sécurisée
// $config = require __DIR__ . '/config.php';
$host = $_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'];
$dbname = $_ENV['DB_NAME'] ?? $_SERVER['DB_NAME'];
$username = $_ENV['DB_USER'] ?? $_SERVER['DB_USER'];
$password = $_ENV['DB_PASS'] ?? $_SERVER['DB_PASS'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Compatibilité: autoriser de nouveaux statuts de réservation
    try {
        $pdo->exec("ALTER TABLE reservations MODIFY COLUMN statut VARCHAR(64) NOT NULL DEFAULT 'en_attente'");
    } catch (PDOException $e) {
        // Non bloquant si permissions SQL limitées
    }

    // Pause par défaut entre 2 séances (en secondes)
    $DEFAULT_BUFFER_SECONDS = 30 * 60;

    $DEFAULT_AVAILABILITY_RULES = [
        0 => ['is_enabled' => 0, 'start_time' => '09:00:00', 'end_time' => '18:30:00', 'slot_interval_minutes' => 30], // Dimanche
        1 => ['is_enabled' => 1, 'start_time' => '15:00:00', 'end_time' => '19:30:00', 'slot_interval_minutes' => 30], // Lundi
        2 => ['is_enabled' => 1, 'start_time' => '15:00:00', 'end_time' => '19:30:00', 'slot_interval_minutes' => 30], // Mardi
        3 => ['is_enabled' => 1, 'start_time' => '09:00:00', 'end_time' => '18:30:00', 'slot_interval_minutes' => 30], // Mercredi
        4 => ['is_enabled' => 1, 'start_time' => '15:00:00', 'end_time' => '19:30:00', 'slot_interval_minutes' => 30], // Jeudi
        5 => ['is_enabled' => 1, 'start_time' => '15:00:00', 'end_time' => '19:30:00', 'slot_interval_minutes' => 30], // Vendredi
        6 => ['is_enabled' => 1, 'start_time' => '09:00:00', 'end_time' => '18:30:00', 'slot_interval_minutes' => 30], // Samedi
    ];

    $ensureAvailabilityRules = function() use ($pdo, $DEFAULT_AVAILABILITY_RULES) {
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS availability_rules (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  weekday TINYINT NOT NULL,
                  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
                  start_time TIME NOT NULL DEFAULT '09:00:00',
                  end_time TIME NOT NULL DEFAULT '18:30:00',
                  slot_interval_minutes TINYINT NOT NULL DEFAULT 30,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  UNIQUE KEY uniq_availability_weekday (weekday)
                )
            ");

            $countStmt = $pdo->query("SELECT COUNT(*) AS count FROM availability_rules");
            $count = (int)($countStmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0);
            if ($count === 0) {
                $insertStmt = $pdo->prepare("
                    INSERT INTO availability_rules (weekday, is_enabled, start_time, end_time, slot_interval_minutes)
                    VALUES (?, ?, ?, ?, ?)
                ");
                foreach ($DEFAULT_AVAILABILITY_RULES as $weekday => $rule) {
                    $insertStmt->execute([
                        $weekday,
                        $rule['is_enabled'],
                        $rule['start_time'],
                        $rule['end_time'],
                        $rule['slot_interval_minutes']
                    ]);
                }
            }
        } catch (PDOException $e) {
            // Si la table n'est pas disponible, on reste compatible avec les règles front existantes
        }
    };

    $getAvailabilityRuleForDate = function($dateStr) use ($pdo, $ensureAvailabilityRules) {
        try {
            $ensureAvailabilityRules();
            $dt = new DateTime($dateStr);
            $weekday = (int)$dt->format('w'); // 0 (dim) -> 6 (sam)
            $stmt = $pdo->prepare("
                SELECT weekday, is_enabled, start_time, end_time, slot_interval_minutes
                FROM availability_rules
                WHERE weekday = ?
                LIMIT 1
            ");
            $stmt->execute([$weekday]);
            $rule = $stmt->fetch(PDO::FETCH_ASSOC);
            return $rule ?: null;
        } catch (Exception $e) {
            return null;
        }
    };

    $ensureVacationPeriods = function() use ($pdo) {
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS vacation_periods (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  title VARCHAR(255) NOT NULL DEFAULT 'Vacances',
                  start_date DATE NOT NULL,
                  end_date DATE NOT NULL,
                  is_active TINYINT(1) NOT NULL DEFAULT 1,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX idx_vacation_dates_active (start_date, end_date, is_active)
                )
            ");
        } catch (PDOException $e) {
            // Table optionnelle: le système continue sans blocage vacances
        }
    };

    $isDateInVacation = function($dateStr) use ($pdo, $ensureVacationPeriods) {
        try {
            $ensureVacationPeriods();
            $stmt = $pdo->prepare("
                SELECT id
                FROM vacation_periods
                WHERE is_active = 1
                  AND ? BETWEEN start_date AND end_date
                LIMIT 1
            ");
            $stmt->execute([$dateStr]);
            return (bool)$stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return false;
        }
    };

    $ensureEventWaitlistEntries = function() use ($pdo) {
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS event_waitlist_entries (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  event_id INT NOT NULL,
                  nom VARCHAR(255) NOT NULL,
                  email VARCHAR(255) NOT NULL,
                  telephone VARCHAR(64) NOT NULL,
                  message TEXT,
                  status ENUM('pending', 'contacted', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX idx_event_waitlist_event (event_id),
                  INDEX idx_event_waitlist_email (email),
                  CONSTRAINT fk_event_waitlist_event
                    FOREIGN KEY (event_id) REFERENCES events(id)
                    ON DELETE CASCADE
                )
            ");
        } catch (PDOException $e) {
            // Compatibilité douce
        }
    };
    
    // Route pour créer une réservation
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_reservation') {
        // Vérifier d'abord si le créneau est encore disponible
        $requestedDuration = intval($_POST['duration_minutes'] ?? 60);
        if (!in_array($requestedDuration, [60, 90], true)) {
            $requestedDuration = 60;
        }

        $rule = $getAvailabilityRuleForDate($_POST['date_reservation'] ?? '');
        $bufferSeconds = $DEFAULT_BUFFER_SECONDS;
        if ($rule) {
            if ((int)$rule['is_enabled'] !== 1) {
                echo json_encode(['success' => false, 'message' => 'Jour non disponible']);
                return;
            }
            $ruleInterval = intval($rule['slot_interval_minutes'] ?? 30);
            if ($ruleInterval > 0) {
                $bufferSeconds = $ruleInterval * 60;
            }
            $requestedSeconds = strtotime('1970-01-01 ' . ($_POST['heure_reservation'] ?? '00:00:00'));
            $startSeconds = strtotime('1970-01-01 ' . $rule['start_time']);
            $endSeconds = strtotime('1970-01-01 ' . $rule['end_time']);
            if ($requestedSeconds === false || $startSeconds === false || $endSeconds === false) {
                echo json_encode(['success' => false, 'message' => 'Horaire invalide']);
                return;
            }
            if ($requestedSeconds < $startSeconds || ($requestedSeconds + ($requestedDuration * 60)) > $endSeconds) {
                echo json_encode(['success' => false, 'message' => 'Créneau en dehors des disponibilités']);
                return;
            }
        }

        if ($isDateInVacation($_POST['date_reservation'] ?? '')) {
            echo json_encode(['success' => false, 'message' => 'Indisponible: période de vacances']);
            return;
        }

        $checkStmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM reservations
            WHERE date_reservation = ?
              AND statut NOT IN ('annulee', 'refuse')
              AND TIME_TO_SEC(?) < (TIME_TO_SEC(heure_reservation) + (COALESCE(duration_minutes, 60) * 60) + ?)
              AND TIME_TO_SEC(heure_reservation) < (TIME_TO_SEC(?) + (? * 60) + ?)
        ");
        
        $checkStmt->execute([
            $_POST['date_reservation'],
            $_POST['heure_reservation'],
            $bufferSeconds,
            $_POST['heure_reservation'],
            $requestedDuration,
            $bufferSeconds
        ]);
        
        $checkResult = $checkStmt->fetch();
        
        if ($checkResult['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'Ce créneau n\'est plus disponible'
            ]);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO reservations (nom, prenom, email, telephone, service_type, date_reservation, heure_reservation, duration_minutes, montant, notes, statut, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $_POST['nom'],
            $_POST['prenom'],
            $_POST['email'],
            $_POST['telephone'],
            $_POST['service_type'],
            $_POST['date_reservation'],
            $_POST['heure_reservation'],
            $requestedDuration,
            $_POST['montant'],
            $_POST['notes'] ?? '',
            $_POST['statut'] ?? 'en_attente'
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Réservation créée avec succès']);
    }
    
    // Route pour vérifier la disponibilité
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'check_availability') {
        $requestedDuration = intval($_POST['duration_minutes'] ?? 60);
        if (!in_array($requestedDuration, [60, 90], true)) {
            $requestedDuration = 60;
        }

        $rule = $getAvailabilityRuleForDate($_POST['date'] ?? '');
        $bufferSeconds = $DEFAULT_BUFFER_SECONDS;
        if ($rule) {
            if ((int)$rule['is_enabled'] !== 1) {
                echo json_encode(['success' => true, 'available' => false]);
                return;
            }
            $ruleInterval = intval($rule['slot_interval_minutes'] ?? 30);
            if ($ruleInterval > 0) {
                $bufferSeconds = $ruleInterval * 60;
            }
            $requestedSeconds = strtotime('1970-01-01 ' . ($_POST['heure'] ?? '00:00:00'));
            $startSeconds = strtotime('1970-01-01 ' . $rule['start_time']);
            $endSeconds = strtotime('1970-01-01 ' . $rule['end_time']);
            if ($requestedSeconds === false || $startSeconds === false || $endSeconds === false) {
                echo json_encode(['success' => true, 'available' => false]);
                return;
            }
            if ($requestedSeconds < $startSeconds || ($requestedSeconds + ($requestedDuration * 60)) > $endSeconds) {
                echo json_encode(['success' => true, 'available' => false]);
                return;
            }
        }

        if ($isDateInVacation($_POST['date'] ?? '')) {
            echo json_encode(['success' => true, 'available' => false]);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM reservations
            WHERE date_reservation = ?
              AND statut NOT IN ('annulee', 'refuse')
              AND TIME_TO_SEC(?) < (TIME_TO_SEC(heure_reservation) + (COALESCE(duration_minutes, 60) * 60) + ?)
              AND TIME_TO_SEC(heure_reservation) < (TIME_TO_SEC(?) + (? * 60) + ?)
        ");
        
        $stmt->execute([
            $_POST['date'],
            $_POST['heure'],
            $bufferSeconds,
            $_POST['heure'],
            $requestedDuration,
            $bufferSeconds
        ]);
        
        $result = $stmt->fetch();
        $available = $result['count'] === 0;
        
        echo json_encode([
            'success' => true, 
            'available' => $available,
            'debug' => [
                'date' => $_POST['date'],
                'heure' => $_POST['heure'],
                'duration_minutes' => $requestedDuration,
                'count' => $result['count']
            ]
        ]);
    }
    
    // Route pour récupérer toutes les réservations
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_reservations') {
        $stmt = $pdo->query("SELECT * FROM reservations ORDER BY created_at DESC");
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $reservations]);
    }

    // Flux calendrier ICS (abonnement téléphone)
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_reservations_ics') {
        $stmt = $pdo->query("
            SELECT id, nom, prenom, service_type, date_reservation, heure_reservation, COALESCE(duration_minutes, 60) AS duration_minutes, statut
            FROM reservations
            WHERE statut NOT IN ('annulee', 'refuse')
            ORDER BY date_reservation ASC, heure_reservation ASC
        ");
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Échappe les caractères spéciaux ICS
        $escapeIcs = function($value) {
            $v = str_replace('\\', '\\\\', (string)$value);
            $v = str_replace(';', '\;', $v);
            $v = str_replace(',', '\,', $v);
            $v = str_replace("\r\n", '\n', $v);
            $v = str_replace("\n", '\n', $v);
            return $v;
        };

        // Découpe une ligne ICS à 75 octets max (spec RFC 5545)
        $foldLine = function($line) {
            $result = '';
            $lineBytes = 0;
            $isFirstSegment = true;
            $chars = preg_split('//u', $line, -1, PREG_SPLIT_NO_EMPTY);
            foreach ($chars as $char) {
                $charBytes = strlen($char);
                $limit = $isFirstSegment ? 75 : 74; // 74 car la continuation commence par un espace
                if ($lineBytes + $charBytes > $limit) {
                    $result .= "\r\n ";
                    $lineBytes = 1; // l'espace de continuation
                    $isFirstSegment = false;
                }
                $result .= $char;
                $lineBytes += $charBytes;
            }
            return $result;
        };

        $output = '';
        $addLine = function($line) use (&$output, $foldLine) {
            $output .= $foldLine($line) . "\r\n";
        };

        $addLine('BEGIN:VCALENDAR');
        $addLine('VERSION:2.0');
        $addLine('PRODID:-//RababAli//Calendrier RDV//FR');
        $addLine('CALSCALE:GREGORIAN');
        $addLine('METHOD:PUBLISH');
        $addLine('X-WR-CALNAME:Rendez-vous Rabab Ali');
        $addLine('X-WR-TIMEZONE:Europe/Zurich');

        foreach ($reservations as $row) {
            $date = trim($row['date_reservation'] ?? '');
            $time = trim($row['heure_reservation'] ?? '');
            if ($date === '' || $time === '') {
                continue;
            }

            try {
                $tz = new DateTimeZone('Europe/Zurich');
                $utc = new DateTimeZone('UTC');
                $start = new DateTime($date . ' ' . substr($time, 0, 5), $tz);
                $duration = intval($row['duration_minutes'] ?? 60);
                if (!in_array($duration, [60, 90], true)) {
                    $duration = 60;
                }
                $end = clone $start;
                $end->modify('+' . $duration . ' minutes');

                // Heures en UTC — universel, pas besoin de VTIMEZONE
                $start->setTimezone($utc);
                $end->setTimezone($utc);
                $created = new DateTime('now', $utc);

                $service = $row['service_type'] ?? '';
                if ($service === 'seance_online') $service = 'Seance en ligne';
                elseif ($service === 'seance_presentiel') $service = 'Seance en presentiel';
                elseif ($service === 'seance_domicile') $service = 'Seance a domicile';
                else $service = 'Seance';

                $clientName = trim(($row['prenom'] ?? '') . ' ' . ($row['nom'] ?? ''));
                $summary = $service;
                if ($clientName !== '') {
                    $summary .= ' - ' . $clientName;
                }

                $uid = 'rabab-rdv-' . intval($row['id']) . '@rababali.com';
                $addLine('BEGIN:VEVENT');
                $addLine('UID:' . $uid);
                $addLine('DTSTAMP:' . $created->format('Ymd\THis\Z'));
                $addLine('DTSTART:' . $start->format('Ymd\THis\Z'));
                $addLine('DTEND:' . $end->format('Ymd\THis\Z'));
                $addLine('SUMMARY:' . $escapeIcs($summary));
                $addLine('DESCRIPTION:Rendez-vous Rabab Ali');
                $addLine('STATUS:CONFIRMED');
                $addLine('END:VEVENT');
            } catch (Exception $e) {
                // Ignorer les entrées invalides
            }
        }

        $addLine('END:VCALENDAR');

        // CORS pour que Google Calendar puisse récupérer le flux depuis ses serveurs
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: text/calendar; charset=utf-8');
        header('Content-Disposition: inline; filename="rendez-vous-rabab.ics"');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        echo $output;
        return;
    }

    // Route admin/public: récupérer les règles hebdomadaires de disponibilité
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_availability_rules') {
        try {
            $ensureAvailabilityRules();
            $stmt = $pdo->query("
                SELECT weekday, is_enabled, start_time, end_time, slot_interval_minutes
                FROM availability_rules
                ORDER BY weekday ASC
            ");
            $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $rules]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: mettre à jour une règle de disponibilité
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_availability_rule') {
        $weekday = intval($_POST['weekday'] ?? -1);
        $isEnabled = intval($_POST['is_enabled'] ?? 0) === 1 ? 1 : 0;
        $startTime = trim($_POST['start_time'] ?? '09:00');
        $endTime = trim($_POST['end_time'] ?? '18:30');
        $slotInterval = intval($_POST['slot_interval_minutes'] ?? 30);

        if ($weekday < 0 || $weekday > 6) {
            echo json_encode(['success' => false, 'message' => 'Jour invalide']);
            return;
        }
        if ($slotInterval < 10 || $slotInterval > 120) {
            $slotInterval = 30;
        }

        $startTimeDb = strlen($startTime) === 5 ? $startTime . ':00' : $startTime;
        $endTimeDb = strlen($endTime) === 5 ? $endTime . ':00' : $endTime;
        if (strtotime('1970-01-01 ' . $startTimeDb) === false || strtotime('1970-01-01 ' . $endTimeDb) === false) {
            echo json_encode(['success' => false, 'message' => 'Horaires invalides']);
            return;
        }
        if (strtotime('1970-01-01 ' . $startTimeDb) >= strtotime('1970-01-01 ' . $endTimeDb)) {
            echo json_encode(['success' => false, 'message' => 'L\'heure de fin doit être après l\'heure de début']);
            return;
        }

        try {
            $ensureAvailabilityRules();
            $stmt = $pdo->prepare("
                INSERT INTO availability_rules (weekday, is_enabled, start_time, end_time, slot_interval_minutes)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  is_enabled = VALUES(is_enabled),
                  start_time = VALUES(start_time),
                  end_time = VALUES(end_time),
                  slot_interval_minutes = VALUES(slot_interval_minutes),
                  updated_at = NOW()
            ");
            $stmt->execute([$weekday, $isEnabled, $startTimeDb, $endTimeDb, $slotInterval]);
            echo json_encode(['success' => true, 'message' => 'Disponibilités mises à jour']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin/public: récupérer les périodes de vacances
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_vacation_periods') {
        try {
            $ensureVacationPeriods();
            $stmt = $pdo->query("
                SELECT id, title, start_date, end_date, is_active
                FROM vacation_periods
                ORDER BY start_date DESC, id DESC
            ");
            $periods = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $periods]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: ajouter une période de vacances
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_vacation_period') {
        $title = trim($_POST['title'] ?? 'Vacances');
        $startDate = trim($_POST['start_date'] ?? '');
        $endDate = trim($_POST['end_date'] ?? '');
        $isActive = intval($_POST['is_active'] ?? 1) === 1 ? 1 : 0;

        if (empty($startDate) || empty($endDate)) {
            echo json_encode(['success' => false, 'message' => 'Date de début et date de fin requises']);
            return;
        }
        if (strtotime($startDate) === false || strtotime($endDate) === false || strtotime($startDate) > strtotime($endDate)) {
            echo json_encode(['success' => false, 'message' => 'Plage de dates invalide']);
            return;
        }

        try {
            $ensureVacationPeriods();
            $stmt = $pdo->prepare("
                INSERT INTO vacation_periods (title, start_date, end_date, is_active)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$title !== '' ? $title : 'Vacances', $startDate, $endDate, $isActive]);
            echo json_encode(['success' => true, 'message' => 'Période de vacances ajoutée']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: mettre à jour une période de vacances
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_vacation_period') {
        $id = intval($_POST['id'] ?? 0);
        $title = trim($_POST['title'] ?? 'Vacances');
        $startDate = trim($_POST['start_date'] ?? '');
        $endDate = trim($_POST['end_date'] ?? '');
        $isActive = intval($_POST['is_active'] ?? 1) === 1 ? 1 : 0;

        if ($id <= 0 || empty($startDate) || empty($endDate)) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            return;
        }
        if (strtotime($startDate) === false || strtotime($endDate) === false || strtotime($startDate) > strtotime($endDate)) {
            echo json_encode(['success' => false, 'message' => 'Plage de dates invalide']);
            return;
        }

        try {
            $ensureVacationPeriods();
            $stmt = $pdo->prepare("
                UPDATE vacation_periods
                SET title = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$title !== '' ? $title : 'Vacances', $startDate, $endDate, $isActive, $id]);
            echo json_encode(['success' => true, 'message' => 'Période de vacances mise à jour']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: supprimer une période de vacances
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete_vacation_period') {
        $id = intval($_POST['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            return;
        }

        try {
            $ensureVacationPeriods();
            $stmt = $pdo->prepare("DELETE FROM vacation_periods WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Période supprimée']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route publique: récupérer la prochaine session de liste d'attente ouverte
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_active_waitlist_session') {
        try {
            // Auto-archiver les sessions ouvertes passées
            $archiveStmt = $pdo->prepare("
                UPDATE waitlist_sessions
                SET status = 'archived'
                WHERE status = 'open'
                  AND session_date < CURDATE()
            ");
            $archiveStmt->execute();

            $stmt = $pdo->prepare("
                SELECT id, title, session_date, start_time, end_time, location, price_label, capacity, status
                FROM waitlist_sessions
                WHERE status = 'open'
                  AND session_date >= CURDATE()
                ORDER BY session_date ASC, start_time ASC
                LIMIT 1
            ");
            $stmt->execute();
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $session ?: null]);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route publique: récupérer toutes les sessions de liste d'attente ouvertes (futures)
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_open_waitlist_sessions') {
        try {
            // Auto-archiver les sessions ouvertes passées
            $archiveStmt = $pdo->prepare("
                UPDATE waitlist_sessions
                SET status = 'archived'
                WHERE status = 'open'
                  AND session_date < CURDATE()
            ");
            $archiveStmt->execute();

            $stmt = $pdo->prepare("
                SELECT id, title, session_date, start_time, end_time, location, price_label, capacity, status
                FROM waitlist_sessions
                WHERE status = 'open'
                  AND session_date >= CURDATE()
                ORDER BY session_date ASC, start_time ASC
            ");
            $stmt->execute();
            $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $sessions]);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route publique: rejoindre la liste d'attente
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'join_waitlist') {
        $sessionId = intval($_POST['session_id'] ?? 0);
        $nom = trim($_POST['nom'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $telephone = trim($_POST['telephone'] ?? '');
        $message = trim($_POST['message'] ?? '');

        if ($sessionId <= 0 || empty($nom) || empty($email) || empty($telephone)) {
            echo json_encode(['success' => false, 'message' => 'Session, nom, email et téléphone sont requis']);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Adresse email invalide']);
            return;
        }

        try {
            $sessionStmt = $pdo->prepare("
                SELECT id, capacity
                FROM waitlist_sessions
                WHERE id = ?
                  AND status = 'open'
                  AND session_date >= CURDATE()
                LIMIT 1
            ");
            $sessionStmt->execute([$sessionId]);
            $session = $sessionStmt->fetch(PDO::FETCH_ASSOC);

            if (!$session) {
                echo json_encode(['success' => false, 'message' => 'Cette session de liste d\'attente n\'est plus disponible']);
                return;
            }

            // Empêcher les doublons email sur la même session
            $dupStmt = $pdo->prepare("
                SELECT COUNT(*) AS count
                FROM waitlist_entries
                WHERE session_id = ?
                  AND email = ?
                  AND status IN ('pending', 'contacted', 'confirmed')
            ");
            $dupStmt->execute([$sessionId, $email]);
            $dup = $dupStmt->fetch(PDO::FETCH_ASSOC);
            if (($dup['count'] ?? 0) > 0) {
                echo json_encode(['success' => false, 'message' => 'Vous êtes déjà inscrit(e) à cette liste d\'attente']);
                return;
            }

            // Vérifier capacité si définie
            if (!empty($session['capacity'])) {
                $countStmt = $pdo->prepare("
                    SELECT COUNT(*) AS count
                    FROM waitlist_entries
                    WHERE session_id = ?
                      AND status IN ('pending', 'contacted', 'confirmed')
                ");
                $countStmt->execute([$sessionId]);
                $current = $countStmt->fetch(PDO::FETCH_ASSOC);
                if (intval($current['count'] ?? 0) >= intval($session['capacity'])) {
                    echo json_encode(['success' => false, 'message' => 'La liste d\'attente est complète pour cette session']);
                    return;
                }
            }

            $insertStmt = $pdo->prepare("
                INSERT INTO waitlist_entries (session_id, nom, email, telephone, message, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending', NOW())
            ");
            $insertStmt->execute([$sessionId, $nom, $email, $telephone, $message]);

            echo json_encode(['success' => true, 'message' => 'Inscription à la liste d\'attente enregistrée']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route publique: rejoindre la liste d'attente d'un événement
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'join_event_waitlist') {
        $eventId = intval($_POST['event_id'] ?? 0);
        $nom = trim($_POST['nom'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $telephone = trim($_POST['telephone'] ?? '');
        $message = trim($_POST['message'] ?? '');

        if ($eventId <= 0 || empty($nom) || empty($email) || empty($telephone)) {
            echo json_encode(['success' => false, 'message' => 'Événement, nom, email et téléphone sont requis']);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Adresse email invalide']);
            return;
        }

        try {
            $eventStmt = $pdo->prepare("
                SELECT id, titre
                FROM events
                WHERE id = ?
                LIMIT 1
            ");
            $eventStmt->execute([$eventId]);
            $event = $eventStmt->fetch(PDO::FETCH_ASSOC);
            if (!$event) {
                echo json_encode(['success' => false, 'message' => 'Événement introuvable']);
                return;
            }

            $ensureEventWaitlistEntries();

            // Empêcher les doublons email actifs sur le même événement
            $dupStmt = $pdo->prepare("
                SELECT COUNT(*) AS count
                FROM event_waitlist_entries
                WHERE event_id = ?
                  AND email = ?
                  AND status IN ('pending', 'contacted', 'confirmed')
            ");
            $dupStmt->execute([$eventId, $email]);
            $dup = $dupStmt->fetch(PDO::FETCH_ASSOC);
            if (intval($dup['count'] ?? 0) > 0) {
                echo json_encode(['success' => false, 'message' => 'Vous êtes déjà inscrit(e) à la liste d\'attente de cet événement']);
                return;
            }

            $insertStmt = $pdo->prepare("
                INSERT INTO event_waitlist_entries (event_id, nom, email, telephone, message, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending', NOW())
            ");
            $insertStmt->execute([$eventId, $nom, $email, $telephone, $message]);

            echo json_encode(['success' => true, 'message' => 'Inscription à la liste d\'attente enregistrée']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: récupérer les inscrits liste d'attente d'un événement
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_event_waitlist_entries') {
        $eventId = intval($_GET['event_id'] ?? 0);
        if ($eventId <= 0) {
            echo json_encode(['success' => false, 'message' => 'event_id requis']);
            return;
        }

        try {
            $ensureEventWaitlistEntries();
            $stmt = $pdo->prepare("
                SELECT id, event_id, nom, email, telephone, message, status, created_at
                FROM event_waitlist_entries
                WHERE event_id = ?
                ORDER BY created_at DESC
            ");
            $stmt->execute([$eventId]);
            $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $entries]);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: mettre à jour statut d'un inscrit liste d'attente événement
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_event_waitlist_entry_status') {
        $id = intval($_POST['id'] ?? 0);
        $status = trim($_POST['status'] ?? '');
        $allowed = ['pending', 'contacted', 'confirmed', 'cancelled'];
        if ($id <= 0 || !in_array($status, $allowed, true)) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            return;
        }

        try {
            $ensureEventWaitlistEntries();
            $stmt = $pdo->prepare("
                UPDATE event_waitlist_entries
                SET status = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$status, $id]);
            echo json_encode(['success' => true, 'message' => 'Statut mis à jour']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: mettre à jour le statut de tous les inscrits d'un événement
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_event_waitlist_entries_status_bulk') {
        $eventId = intval($_POST['event_id'] ?? 0);
        $status = trim($_POST['status'] ?? '');
        $allowed = ['pending', 'contacted', 'confirmed', 'cancelled'];
        if ($eventId <= 0 || !in_array($status, $allowed, true)) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            return;
        }

        try {
            $ensureEventWaitlistEntries();
            $stmt = $pdo->prepare("
                UPDATE event_waitlist_entries
                SET status = ?, updated_at = NOW()
                WHERE event_id = ?
            ");
            $stmt->execute([$status, $eventId]);
            echo json_encode(['success' => true, 'message' => 'Statut de tous les inscrits mis à jour']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: supprimer un inscrit liste d'attente événement
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete_event_waitlist_entry') {
        $id = intval($_POST['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            return;
        }

        try {
            $ensureEventWaitlistEntries();
            $stmt = $pdo->prepare("DELETE FROM event_waitlist_entries WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Inscrit supprimé']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }
    
    // Route pour récupérer tous les événements
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_events') {
        // Supprimer automatiquement les événements expirés (date_fin passée)
        $today = date('Y-m-d');
        $deleteStmt = $pdo->prepare("DELETE FROM events WHERE date_fin < :today");
        $deleteStmt->execute(['today' => $today]);
        
        // Récupérer les événements restants
        $stmt = $pdo->query("SELECT id, titre, description, date_event, date_fin, prix, devise, image_url, type, modele, sous_titre, lieu, texte, url_inscription, is_promotion, prix_promo FROM events ORDER BY date_event DESC");
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Récupérer les URLs vidéo liées aux événements (si table présente)
        $videosByEvent = [];
        try {
            $videosStmt = $pdo->query("SELECT event_id, video_url FROM event_videos ORDER BY event_id ASC, ordre ASC, id ASC");
            $videos = $videosStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($videos as $video) {
                $eventId = (int)$video['event_id'];
                if (!isset($videosByEvent[$eventId])) {
                    $videosByEvent[$eventId] = [];
                }
                $videosByEvent[$eventId][] = $video['video_url'];
            }
        } catch (PDOException $e) {
            // Si la table event_videos n'existe pas encore, on continue sans vidéos
        }

        foreach ($events as &$event) {
            $eventId = (int)$event['id'];
            $event['video_urls'] = $videosByEvent[$eventId] ?? [];
        }
        unset($event);
        echo json_encode(['success' => true, 'data' => $events]);
    }
    
    // Route pour récupérer la promotion active pour les rendez-vous
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_active_promotion') {
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT id, titre, date_event, date_fin, prix_promo FROM events WHERE is_promotion = 1 AND date_event <= :today AND date_fin >= :today ORDER BY date_event DESC LIMIT 1");
        $stmt->execute(['today' => $today]);
        $promotion = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($promotion) {
            echo json_encode(['success' => true, 'data' => $promotion]);
        } else {
            echo json_encode(['success' => true, 'data' => null]);
        }
    }
    
    // Route pour récupérer toutes les expériences
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_experiences') {
        $all = isset($_GET['all']) && $_GET['all'] == 1;
        if ($all) {
            $stmt = $pdo->query("SELECT id, nom, titre, message, date_creation, statut FROM experiences ORDER BY date_creation DESC");
        } else {
            $stmt = $pdo->prepare("SELECT id, nom, titre, message, date_creation, statut FROM experiences WHERE statut = 'valide' ORDER BY date_creation DESC");
            $stmt->execute();
        }
        $experiences = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $experiences]);
    }
    
    // Route pour ajouter une nouvelle expérience
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_experience') {
        $nom = trim($_POST['nom'] ?? '');
        $titre = trim($_POST['titre'] ?? '');
        $message = trim($_POST['message'] ?? '');
        
        if (empty($nom) || empty($titre) || empty($message)) {
            echo json_encode(['success' => false, 'message' => 'Tous les champs sont requis']);
        } else {
            try {
                $stmt = $pdo->prepare("INSERT INTO experiences (nom, titre, message, date_creation, modere, affiche, statut) VALUES (?, ?, ?, NOW(), 0, 0, 'en_attente')");
                if ($stmt->execute([$nom, $titre, $message])) {
                    echo json_encode(['success' => true, 'message' => 'Expérience ajoutée avec succès']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout de l\'expérience']);
                }
            } catch(PDOException $e) {
                echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
            }
        }
    }
    
    // Route pour ajouter un événement classique
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_event') {
        $titre = trim($_POST['titre'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $date_event = trim($_POST['date_event'] ?? '');
        $date_fin = trim($_POST['date_fin'] ?? '');
        $prix = trim($_POST['prix'] ?? '');
        $devise = trim($_POST['devise'] ?? '€');
        $url_inscription = trim($_POST['url_inscription'] ?? '');
        $is_promotion = isset($_POST['is_promotion']) ? (int)$_POST['is_promotion'] : 0;
        $prix_promo = trim($_POST['prix_promo'] ?? '');
        $type = 'event';
        $image_url = '';

        // ✅ SÉCURITÉ : Upload sécurisé avec validation stricte
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadFile = $_FILES['image'];
            $maxSize = 5 * 1024 * 1024; // 5MB max
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            $allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
            
            // Validation taille
            if ($uploadFile['size'] > $maxSize) {
                echo json_encode(['success' => false, 'message' => 'Fichier trop volumineux (max 5MB)']);
                exit;
            }
            
            // Validation type MIME
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $uploadFile['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($mimeType, $allowedTypes)) {
                echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé']);
                exit;
            }
            
            // Validation extension
            $ext = strtolower(pathinfo($uploadFile['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExts)) {
                echo json_encode(['success' => false, 'message' => 'Extension non autorisée']);
                exit;
            }
            
            // Génération nom sécurisé
            $filename = 'event_' . uniqid() . '_' . time() . '.' . $ext;
            $dest = __DIR__ . "/../images/events_uploads/" . $filename;
            
            // Vérification directory traversal
            $realDest = realpath(dirname($dest)) . '/' . basename($dest);
            if (strpos($realDest, realpath(__DIR__ . "/../images/events_uploads/")) !== 0) {
                echo json_encode(['success' => false, 'message' => 'Chemin non autorisé']);
                exit;
            }
            
            if (move_uploaded_file($uploadFile['tmp_name'], $dest)) {
                $image_url = "/rabab/images/events_uploads/" . $filename;
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'upload']);
                exit;
            }
        }

        $videoUrlsRaw = trim($_POST['video_urls'] ?? '');
        $videoUrls = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $videoUrlsRaw))));

        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO events (titre, description, date_event, date_fin, prix, devise, image_url, type, url_inscription, is_promotion, prix_promo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$titre, $description, $date_event, $date_fin, $prix, $devise, $image_url, $type, $url_inscription, $is_promotion, $prix_promo]);
        $eventId = (int)$pdo->lastInsertId();

        if (!empty($videoUrls)) {
            $videoStmt = $pdo->prepare("INSERT INTO event_videos (event_id, video_url, ordre) VALUES (?, ?, ?)");
            foreach ($videoUrls as $index => $videoUrl) {
                $videoStmt->execute([$eventId, $videoUrl, $index]);
            }
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Événement ajouté avec succès']);
    }
    
    // Route pour ajouter un flyer comme événement spécial
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_flyer') {
        $titre = trim($_POST['titre'] ?? '');
        $sous_titre = trim($_POST['sous_titre'] ?? '');
        $date_event = trim($_POST['date_event'] ?? '');
        $date_fin = trim($_POST['date_fin'] ?? '');
        $prix = trim($_POST['prix'] ?? '');
        $devise = trim($_POST['devise'] ?? '€');
        $lieu = trim($_POST['lieu'] ?? '');
        $texte = trim($_POST['texte'] ?? '');
        $modele = trim($_POST['modele'] ?? 'cercles');
        $image_url = '';
        // Gestion upload image fusionnée du flyer
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $filename = uniqid("flyer_") . "." . $ext;
            $dest = __DIR__ . "/../images/flyers_uploads/" . $filename;
            if (move_uploaded_file($_FILES['image']['tmp_name'], $dest)) {
                $image_url = "/rabab/images/flyers_uploads/" . $filename;
            }
        }
        $stmt = $pdo->prepare("INSERT INTO events (titre, description, date_event, date_fin, prix, devise, image_url, type, sous_titre, lieu, texte, modele) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $desc = $texte; // Utiliser le texte du flyer comme description
        $type = 'flyer';
        $stmt->execute([
            $titre,
            $desc,
            $date_event,
            $date_fin,
            $prix,
            $devise,
            $image_url,
            $type,
            $sous_titre,
            $lieu,
            $texte,
            $modele
        ]);
        echo json_encode(['success' => true, 'message' => 'Flyer ajouté avec succès']);
    }
    
    // Route pour modifier un événement (classique ou flyer)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_event') {
        $id = intval($_POST['id'] ?? 0);
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID événement manquant']);
            exit;
        }
        
        // Récupérer l'événement existant pour connaître son type
        $stmt = $pdo->prepare("SELECT type, modele FROM events WHERE id = ?");
        $stmt->execute([$id]);
        $existingEvent = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existingEvent) {
            echo json_encode(['success' => false, 'message' => 'Événement non trouvé']);
            exit;
        }
        
        $titre = trim($_POST['titre'] ?? '');
        $date_event = trim($_POST['date_event'] ?? '');
        $date_fin = trim($_POST['date_fin'] ?? '');
        $prix = trim($_POST['prix'] ?? '');
        $devise = trim($_POST['devise'] ?? '€');
        
        // Gestion de l'image (optionnelle lors de la modification)
        $image_url = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadFile = $_FILES['image'];
            $maxSize = 5 * 1024 * 1024; // 5MB max
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            $allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
            
            // Validation taille
            if ($uploadFile['size'] > $maxSize) {
                echo json_encode(['success' => false, 'message' => 'Fichier trop volumineux (max 5MB)']);
                exit;
            }
            
            // Validation type MIME
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $uploadFile['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($mimeType, $allowedTypes)) {
                echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé']);
                exit;
            }
            
            // Validation extension
            $ext = strtolower(pathinfo($uploadFile['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExts)) {
                echo json_encode(['success' => false, 'message' => 'Extension non autorisée']);
                exit;
            }
            
            // Génération nom sécurisé
            $isFlyer = ($existingEvent['type'] === 'flyer');
            $prefix = $isFlyer ? 'flyer_' : 'event_';
            $uploadDir = $isFlyer ? 'flyers_uploads' : 'events_uploads';
            $filename = $prefix . uniqid() . '_' . time() . '.' . $ext;
            $dest = __DIR__ . "/../images/{$uploadDir}/" . $filename;
            
            if (move_uploaded_file($uploadFile['tmp_name'], $dest)) {
                $image_url = "/rabab/images/{$uploadDir}/" . $filename;
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'upload']);
                exit;
            }
        }
        
        // Traitement selon le type d'événement
        if ($existingEvent['type'] === 'flyer') {
            // C'est un flyer
            $sous_titre = trim($_POST['sous_titre'] ?? '');
            $lieu = trim($_POST['lieu'] ?? '');
            $texte = trim($_POST['texte'] ?? '');
            $modele = trim($_POST['modele'] ?? $existingEvent['modele']);
            $description = isset($_POST['description']) ? trim($_POST['description']) : $texte;
            
            if ($image_url) {
                // Avec nouvelle image
                $stmt = $pdo->prepare("UPDATE events SET titre = ?, description = ?, date_event = ?, date_fin = ?, prix = ?, devise = ?, image_url = ?, sous_titre = ?, lieu = ?, texte = ?, modele = ? WHERE id = ?");
                $stmt->execute([$titre, $description, $date_event, $date_fin, $prix, $devise, $image_url, $sous_titre, $lieu, $texte, $modele, $id]);
            } else {
                // Sans nouvelle image
                $stmt = $pdo->prepare("UPDATE events SET titre = ?, description = ?, date_event = ?, date_fin = ?, prix = ?, devise = ?, sous_titre = ?, lieu = ?, texte = ?, modele = ? WHERE id = ?");
                $stmt->execute([$titre, $description, $date_event, $date_fin, $prix, $devise, $sous_titre, $lieu, $texte, $modele, $id]);
            }
        } else {
            // C'est un événement classique
            $description = trim($_POST['description'] ?? '');
            $url_inscription = trim($_POST['url_inscription'] ?? '');
            $videoUrlsRaw = trim($_POST['video_urls'] ?? '');
            $videoUrls = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $videoUrlsRaw))));
            $is_promotion = isset($_POST['is_promotion']) ? (int)$_POST['is_promotion'] : 0;
            $prix_promo = trim($_POST['prix_promo'] ?? '');

            $pdo->beginTransaction();
            if ($image_url) {
                // Avec nouvelle image
                $stmt = $pdo->prepare("UPDATE events SET titre = ?, description = ?, date_event = ?, date_fin = ?, prix = ?, devise = ?, image_url = ?, url_inscription = ?, is_promotion = ?, prix_promo = ? WHERE id = ?");
                $stmt->execute([$titre, $description, $date_event, $date_fin, $prix, $devise, $image_url, $url_inscription, $is_promotion, $prix_promo, $id]);
            } else {
                // Sans nouvelle image
                $stmt = $pdo->prepare("UPDATE events SET titre = ?, description = ?, date_event = ?, date_fin = ?, prix = ?, devise = ?, url_inscription = ?, is_promotion = ?, prix_promo = ? WHERE id = ?");
                $stmt->execute([$titre, $description, $date_event, $date_fin, $prix, $devise, $url_inscription, $is_promotion, $prix_promo, $id]);
            }

            // Remplacer les vidéos associées
            $deleteVideosStmt = $pdo->prepare("DELETE FROM event_videos WHERE event_id = ?");
            $deleteVideosStmt->execute([$id]);
            if (!empty($videoUrls)) {
                $insertVideoStmt = $pdo->prepare("INSERT INTO event_videos (event_id, video_url, ordre) VALUES (?, ?, ?)");
                foreach ($videoUrls as $index => $videoUrl) {
                    $insertVideoStmt->execute([$id, $videoUrl, $index]);
                }
            }
            $pdo->commit();
        }
        
        echo json_encode(['success' => true, 'message' => 'Événement modifié avec succès']);
    }
    
    // Route pour supprimer un événement (classique ou flyer)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && ((isset($_POST['action']) && $_POST['action'] === 'delete_event') || (isset($_GET['action']) && $_GET['action'] === 'delete_event' && isset($_GET['id']))) ) {
        // Récupérer l'id de l'événement à supprimer
        $id = isset($_POST['id']) ? intval($_POST['id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            return;
        }
        // Récupérer l'URL de l'image pour suppression physique
        $stmt = $pdo->prepare('SELECT image_url FROM events WHERE id = ?');
        $stmt->execute([$id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$event) {
            echo json_encode(['success' => false, 'message' => 'Événement introuvable']);
            return;
        }
        // Supprimer l'image du serveur si elle existe
        if (!empty($event['image_url'])) {
            $imagePath = $_SERVER['DOCUMENT_ROOT'] . $event['image_url'];
            if (file_exists($imagePath)) {
                @unlink($imagePath);
            }
        }
        // Supprimer d'abord les vidéos liées (au cas où la FK n'est pas en CASCADE)
        $deleteVideosStmt = $pdo->prepare('DELETE FROM event_videos WHERE event_id = ?');
        $deleteVideosStmt->execute([$id]);

        // Supprimer l'événement de la base
        $stmt = $pdo->prepare('DELETE FROM events WHERE id = ?');
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true, 'message' => 'Événement supprimé avec succès']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
        }
    }
    
    // Route pour supprimer une expérience/avis
    elseif (
        $_SERVER['REQUEST_METHOD'] === 'POST' &&
        ((isset($_POST['action']) && $_POST['action'] === 'delete_experience') || (isset($_GET['action']) && $_GET['action'] === 'delete_experience' && isset($_GET['id'])))
    ) {
        $id = isset($_POST['id']) ? intval($_POST['id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            return;
        }
        $stmt = $pdo->prepare('DELETE FROM experiences WHERE id = ?');
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true, 'message' => 'Avis supprimé avec succès']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
        }
    }

    
    // Route pour modifier un rendez-vous
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_reservation') {
        $id = intval($_POST['id'] ?? 0);
        $nom = trim($_POST['nom'] ?? '');
        $prenom = trim($_POST['prenom'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $telephone = trim($_POST['telephone'] ?? '');
        $service_type = trim($_POST['service_type'] ?? '');
        $date_reservation = trim($_POST['date_reservation'] ?? '');
        $heure_reservation = trim($_POST['heure_reservation'] ?? '');
        $montant = floatval($_POST['montant'] ?? 0);
        $notes = trim($_POST['notes'] ?? '');
        $statut = trim($_POST['statut'] ?? 'en_attente');
        $allowedReservationStatus = ['en_attente', 'payee_a_confirmer', 'confirmee', 'annulee', 'reportee', 'terminee'];
        if (!in_array($statut, $allowedReservationStatus, true)) {
            $statut = 'en_attente';
        }
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de rendez-vous invalide']);
            return;
        }
        
        if (empty($nom) || empty($prenom) || empty($email) || empty($telephone) || 
            empty($service_type) || empty($date_reservation) || empty($heure_reservation)) {
            echo json_encode(['success' => false, 'message' => 'Tous les champs obligatoires doivent être remplis']);
            return;
        }
        
        try {
            $oldStmt = $pdo->prepare("
                SELECT statut, date_reservation, heure_reservation
                FROM reservations
                WHERE id = ?
                LIMIT 1
            ");
            $oldStmt->execute([$id]);
            $oldReservation = $oldStmt->fetch(PDO::FETCH_ASSOC);
            if (!$oldReservation) {
                echo json_encode(['success' => false, 'message' => 'Rendez-vous introuvable']);
                return;
            }

            $stmt = $pdo->prepare("
                UPDATE reservations SET 
                nom = ?, prenom = ?, email = ?, telephone = ?, service_type = ?, 
                date_reservation = ?, heure_reservation = ?, montant = ?, notes = ?, statut = ?
                WHERE id = ?
            ");
            
            if ($stmt->execute([$nom, $prenom, $email, $telephone, $service_type, $date_reservation, $heure_reservation, $montant, $notes, $statut, $id])) {
                $oldStatus = trim($oldReservation['statut'] ?? '');
                $statusChanged = $oldStatus !== $statut;
                if ($statusChanged && in_array($statut, ['confirmee', 'annulee', 'reportee'], true)) {
                    $mailPayload = [
                        'nom' => $nom,
                        'prenom' => $prenom,
                        'email' => $email,
                        'telephone' => $telephone,
                        'service_type' => $service_type,
                        'date_reservation' => $date_reservation,
                        'heure_reservation' => $heure_reservation,
                        'duration_minutes' => intval($_POST['duration_minutes'] ?? 60),
                        'montant' => $montant,
                        'notes' => $notes,
                    ];
                    try {
                        sendReservationDecisionEmail($mailPayload, $statut);
                    } catch (Exception $e) {
                        error_log("Erreur envoi mail décision réservation: " . $e->getMessage());
                    }
                }
                echo json_encode(['success' => true, 'message' => 'Rendez-vous modifié avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la modification du rendez-vous']);
            }
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }
    
    // Route pour supprimer un rendez-vous
    elseif (
        $_SERVER['REQUEST_METHOD'] === 'POST' &&
        ((isset($_POST['action']) && $_POST['action'] === 'delete_reservation') || (isset($_GET['action']) && $_GET['action'] === 'delete_reservation' && isset($_GET['id'])))
    ) {
        $id = isset($_POST['id']) ? intval($_POST['id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);
        
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de rendez-vous invalide']);
            return;
        }
        
        try {
            $stmt = $pdo->prepare('DELETE FROM reservations WHERE id = ?');
            if ($stmt->execute([$id])) {
                echo json_encode(['success' => true, 'message' => 'Rendez-vous supprimé avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression du rendez-vous']);
            }
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: annuler un rendez-vous (sans suppression)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'cancel_reservation') {
        $id = intval($_POST['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de rendez-vous invalide']);
            return;
        }

        try {
            $getStmt = $pdo->prepare("
                SELECT nom, prenom, email, telephone, service_type, date_reservation, heure_reservation, montant, notes
                FROM reservations
                WHERE id = ?
                LIMIT 1
            ");
            $getStmt->execute([$id]);
            $reservation = $getStmt->fetch(PDO::FETCH_ASSOC);
            if (!$reservation) {
                echo json_encode(['success' => false, 'message' => 'Rendez-vous introuvable']);
                return;
            }

            $stmt = $pdo->prepare("
                UPDATE reservations
                SET statut = 'annulee'
                WHERE id = ?
            ");
            if ($stmt->execute([$id])) {
                try {
                    sendReservationDecisionEmail($reservation, 'annulee');
                } catch (Exception $e) {
                    error_log("Erreur envoi mail annulation rapide: " . $e->getMessage());
                }
                echo json_encode(['success' => true, 'message' => 'Rendez-vous annulé avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'annulation du rendez-vous']);
            }
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }
    
    // Route pour modérer un avis (valider ou refuser)
    elseif (
        $_SERVER['REQUEST_METHOD'] === 'POST'
        && isset($_GET['action']) && $_GET['action'] === 'moderate_experience'
        && isset($_GET['id']) && isset($_GET['statut'])
    ) {
        $id = intval($_GET['id']);
        $statut = $_GET['statut'];
        if (!in_array($statut, ['valide', 'refuse'])) {
            echo json_encode(['success' => false, 'message' => 'Statut invalide']);
            return;
        }
        $stmt = $pdo->prepare("UPDATE experiences SET statut = ? WHERE id = ?");
        if ($stmt->execute([$statut, $id])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
        }
    }

    
    // Route pour récupérer les réservations d'une date spécifique
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_reservations_for_date') {
        $date = $_GET['date'] ?? '';
        $service = $_GET['service'] ?? '';
        
        if (empty($date)) {
            echo json_encode(['success' => false, 'message' => 'Date requise']);
            return;
        }
        
        try {
            $stmt = $pdo->prepare("
                SELECT heure_reservation, service_type, COALESCE(duration_minutes, 60) AS duration_minutes
                FROM reservations 
                WHERE date_reservation = ? 
                AND statut NOT IN ('annulee', 'refuse')
                ORDER BY heure_reservation ASC
            ");
            
            $stmt->execute([$date]);
            $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'data' => $reservations]);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: récupérer toutes les sessions de liste d'attente
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_waitlist_sessions') {
        try {
            // Auto-archiver les sessions ouvertes passées
            $archiveStmt = $pdo->prepare("
                UPDATE waitlist_sessions
                SET status = 'archived'
                WHERE status = 'open'
                  AND session_date < CURDATE()
            ");
            $archiveStmt->execute();

            $stmt = $pdo->prepare("
                SELECT ws.*,
                       COUNT(we.id) AS entries_count
                FROM waitlist_sessions ws
                LEFT JOIN waitlist_entries we
                  ON we.session_id = ws.id
                 AND we.status IN ('pending', 'contacted', 'confirmed')
                GROUP BY ws.id
                ORDER BY ws.session_date DESC, ws.start_time DESC
            ");
            $stmt->execute();
            $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $sessions]);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: récupérer les entrées d'une session
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_waitlist_entries') {
        $sessionId = intval($_GET['session_id'] ?? 0);
        if ($sessionId <= 0) {
            echo json_encode(['success' => false, 'message' => 'session_id requis']);
            return;
        }
        try {
            $stmt = $pdo->prepare("
                SELECT id, session_id, nom, email, telephone, message, status, created_at
                FROM waitlist_entries
                WHERE session_id = ?
                ORDER BY created_at DESC
            ");
            $stmt->execute([$sessionId]);
            $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $entries]);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: ajouter une session de liste d'attente
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_waitlist_session') {
        $title = trim($_POST['title'] ?? 'Journée de constellation familiale');
        $sessionDate = trim($_POST['session_date'] ?? '');
        $startTime = trim($_POST['start_time'] ?? '10:00:00');
        $endTime = trim($_POST['end_time'] ?? '16:00:00');
        $location = trim($_POST['location'] ?? '');
        $priceLabel = trim($_POST['price_label'] ?? '150 CHF');
        $capacityRaw = trim($_POST['capacity'] ?? '');
        $capacity = $capacityRaw === '' ? null : intval($capacityRaw);
        $status = trim($_POST['status'] ?? 'open');
        if (!in_array($status, ['draft', 'open', 'closed', 'archived'], true)) {
            $status = 'open';
        }

        if (empty($sessionDate) || empty($startTime) || empty($endTime)) {
            echo json_encode(['success' => false, 'message' => 'Date, heure de début et heure de fin sont requis']);
            return;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO waitlist_sessions (title, session_date, start_time, end_time, location, price_label, capacity, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$title, $sessionDate, $startTime, $endTime, $location, $priceLabel, $capacity, $status]);
            echo json_encode(['success' => true, 'message' => 'Session de liste d\'attente ajoutée']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: mise à jour d'une session de liste d'attente
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_waitlist_session') {
        $id = intval($_POST['id'] ?? 0);
        $title = trim($_POST['title'] ?? 'Journée de constellation familiale');
        $sessionDate = trim($_POST['session_date'] ?? '');
        $startTime = trim($_POST['start_time'] ?? '10:00:00');
        $endTime = trim($_POST['end_time'] ?? '16:00:00');
        $location = trim($_POST['location'] ?? '');
        $priceLabel = trim($_POST['price_label'] ?? '150 CHF');
        $capacityRaw = trim($_POST['capacity'] ?? '');
        $capacity = $capacityRaw === '' ? null : intval($capacityRaw);
        $status = trim($_POST['status'] ?? 'open');
        if (!in_array($status, ['draft', 'open', 'closed', 'archived'], true)) {
            $status = 'open';
        }

        if ($id <= 0 || empty($sessionDate) || empty($startTime) || empty($endTime)) {
            echo json_encode(['success' => false, 'message' => 'ID, date, heure de début et heure de fin sont requis']);
            return;
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE waitlist_sessions
                SET title = ?, session_date = ?, start_time = ?, end_time = ?, location = ?, price_label = ?, capacity = ?, status = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$title, $sessionDate, $startTime, $endTime, $location, $priceLabel, $capacity, $status, $id]);
            echo json_encode(['success' => true, 'message' => 'Session de liste d\'attente mise à jour']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: supprimer une session de liste d'attente
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete_waitlist_session') {
        $id = intval($_POST['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            return;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM waitlist_sessions WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Session supprimée']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: supprimer un inscrit de liste d'attente
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete_waitlist_entry') {
        $id = intval($_POST['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID invalide']);
            return;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM waitlist_entries WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Inscrit supprimé']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: changer le statut d'un inscrit de liste d'attente
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_waitlist_entry_status') {
        $id = intval($_POST['id'] ?? 0);
        $status = trim($_POST['status'] ?? '');
        $allowed = ['pending', 'contacted', 'confirmed', 'cancelled'];

        if ($id <= 0 || !in_array($status, $allowed, true)) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            return;
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE waitlist_entries
                SET status = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$status, $id]);
            echo json_encode(['success' => true, 'message' => 'Statut mis à jour']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }

    // Route admin: changer le statut de tous les inscrits d'une session
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_waitlist_entries_status_bulk') {
        $sessionId = intval($_POST['session_id'] ?? 0);
        $status = trim($_POST['status'] ?? '');
        $allowed = ['pending', 'contacted', 'confirmed', 'cancelled'];

        if ($sessionId <= 0 || !in_array($status, $allowed, true)) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            return;
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE waitlist_entries
                SET status = ?, updated_at = NOW()
                WHERE session_id = ?
            ");
            $stmt->execute([$status, $sessionId]);
            echo json_encode(['success' => true, 'message' => 'Statut de tous les inscrits mis à jour']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }
    
    // Route d'authentification admin
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'admin_login') {
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Identifiants manquants']);
            return;
        }
        
        try {
            $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE username = ? LIMIT 1');
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password_hash'])) {
                echo json_encode(['success' => true, 'message' => 'Authentification réussie']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Identifiants incorrects']);
            }
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
        }
    }
    
    // Route de santé
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'health') {
        echo json_encode([
            'success' => true, 
            'message' => 'API opérationnelle',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    else {
        echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
    }
    
} catch(PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?> 