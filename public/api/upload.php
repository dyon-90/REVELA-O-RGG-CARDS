<?php
// Hostinger PHP Upload Endpoint for Videos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Upload directory path (public_html/uploads)
$uploadsDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

if (!isset($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    $errorMsg = 'Nenhum vídeo foi enviado ou ocorreu um erro no upload.';
    if (isset($_FILES['video']['error'])) {
        switch ($_FILES['video']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errorMsg = 'Arquivo excede o limite máximo configurado no servidor (php.ini).';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errorMsg = 'Upload parcial. Tente novamente.';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errorMsg = 'Nenhum arquivo enviado.';
                break;
        }
    }
    echo json_encode(['success' => false, 'error' => $errorMsg]);
    exit;
}

$file = $_FILES['video'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['mp4', 'webm', 'mov', 'ogg', 'ogv', 'mkv'];

if (!in_array($ext, $allowed)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Formato não suportado. Envie MP4, WebM ou MOV.']);
    exit;
}

// Generate unique clean filename
$cleanName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
$unique = time() . '-' . mt_rand(1000, 9999);
$targetFilename = "video-{$unique}-{$cleanName}.{$ext}";
$targetPath = $uploadsDir . $targetFilename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $videoUrl = '/uploads/' . $targetFilename;
    echo json_encode([
        'success' => true,
        'videoUrl' => $videoUrl,
        'filename' => $targetFilename,
        'size' => $file['size'],
        'mimetype' => $file['type'],
        'message' => 'Vídeo salvo com sucesso na Hostinger.'
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Falha ao gravar o arquivo de vídeo no servidor Hostinger. Verifique permissões da pasta uploads (755).']);
}
