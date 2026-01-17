<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = getenv('DB_HOST') ?: 'mysql-service';
$db = 'todoapp';
$user = 'root';
$pass = 'rootpass123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));

$headers = getallheaders();
$userId = isset($headers['X-User-Id']) ? (int)$headers['X-User-Id'] : 1;

switch($method) {
    case 'GET':
        if ($segments[0] === 'tasks' || (isset($segments[1]) && $segments[1] === 'tasks')) {
            $stmt = $pdo->prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$userId]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        break;
        
    case 'POST':
        if ($segments[0] === 'tasks' || (isset($segments[1]) && $segments[1] === 'tasks')) {
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $data['title'], $data['description'] ?? '']);
            echo json_encode(['id' => $pdo->lastInsertId(), 'message' => 'Task created']);
        }
        break;
        
    case 'PUT':
        $taskId = end($segments);
        if (is_numeric($taskId)) {
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$data['status'], $taskId, $userId]);
            echo json_encode(['message' => 'Task updated']);
        }
        break;
        
    case 'DELETE':
        $taskId = end($segments);
        if (is_numeric($taskId)) {
            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?");
            $stmt->execute([$taskId, $userId]);
            echo json_encode(['message' => 'Task deleted']);
        }
        break;
}
?>