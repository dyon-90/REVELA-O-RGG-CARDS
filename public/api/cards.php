<?php
// Hostinger PHP Endpoint to get and save cards
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/cards_database.json';

// GET: read cards
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        echo file_get_contents($dataFile);
    } else {
        echo json_encode(['success' => true, 'cards' => []]);
    }
    exit;
}

// PUT / POST: save cards
if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $decoded = json_decode($input, true);
    if (isset($decoded['cards']) && is_array($decoded['cards'])) {
        file_put_contents($dataFile, json_encode(['success' => true, 'cards' => $decoded['cards']], JSON_PRETTY_PRINT));
        echo json_encode(['success' => true, 'count' => count($decoded['cards'])]);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Formato de cards inválido']);
    }
    exit;
}
