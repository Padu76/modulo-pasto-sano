<?php
// stripe-checkout.php - Backend per gestire pagamenti Stripe
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gestisci richieste OPTIONS per CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// IMPORTANTE: Sostituisci con la tua Stripe Secret Key
$stripe_secret_key = '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';

// Ricevi dati dal frontend
$input = json_decode(file_get_contents('php://input'), true);

// Validazione dati
$customer_name = $input['customerName'] ?? '';
$pickup_date = $input['pickupDate'] ?? '';
$amount = $input['amount'] ?? 0;
$items = $input['items'] ?? [];
$success_url = $input['success_url'] ?? 'https://yourdomain.com/success.html';
$cancel_url = $input['cancel_url'] ?? 'https://yourdomain.com/';

if (empty($customer_name) || empty($pickup_date) || $amount <= 0) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Dati mancanti o non validi',
        'details' => [
            'customerName' => $customer_name,
            'pickupDate' => $pickup_date,
            'amount' => $amount
        ]
    ]);
    exit;
}

// Prepara line_items per Stripe
$line_items = [];

// Aggiungi ogni prodotto come line item separato
foreach ($items as $item) {
    if (isset($item['name'], $item['price'], $item['quantity']) && $item['quantity'] > 0) {
        $line_items[] = [
            'price_data' => [
                'currency' => 'eur',
                'product_data' => [
                    'name' => $item['name'],
                    'description' => 'Pasto Sano - Ritiro: ' . $pickup_date
                ],
                'unit_amount' => $item['price'] * 100, // Stripe usa centesimi
            ],
            'quantity' => $item['quantity'],
        ];
    }
}

// Se non ci sono line_items validi, crea un singolo item con il totale
if (empty($line_items)) {
    $line_items = [[
        'price_data' => [
            'currency' => 'eur',
            'product_data' => [
                'name' => 'Ordine Pasto Sano - ' . $customer_name,
                'description' => 'Ritiro: ' . $pickup_date
            ],
            'unit_amount' => $amount * 100,
        ],
        'quantity' => 1,
    ]];
}

// Prepara dati per Stripe Checkout Session
$checkout_session_data = [
    'payment_method_types' => ['card'],
    'line_items' => $line_items,
    'mode' => 'payment',
    'success_url' => $success_url . '?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url' => $cancel_url,
    'customer_email' => '', // Opzionale: puoi richiedere email nel form
    'billing_address_collection' => 'auto',
    'shipping_address_collection' => [
        'allowed_countries' => ['IT'] // Solo Italia
    ],
    'metadata' => [
        'customer_name' => $customer_name,
        'pickup_date' => $pickup_date,
        'order_details' => json_encode($items),
        'total_amount' => $amount,
        'source' => 'pasto_sano_website'
    ],
    'payment_intent_data' => [
        'metadata' => [
            'customer_name' => $customer_name,
            'pickup_date' => $pickup_date,
            'source' => 'pasto_sano_website'
        ]
    ]
];

// Log per debugging (rimuovi in produzione)
error_log('Stripe Checkout Data: ' . json_encode($checkout_session_data));

// Chiamata API Stripe
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.stripe.com/v1/checkout/sessions',
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($checkout_session_data),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $stripe_secret_key,
        'Content-Type: application/x-www-form-urlencoded'
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

// Gestisci errori cURL
if ($curl_error) {
    error_log('cURL Error: ' . $curl_error);
    http_response_code(500);
    echo json_encode([
        'error' => 'Errore di connessione al servizio di pagamento',
        'details' => $curl_error
    ]);
    exit;
}

// Gestisci risposta Stripe
if ($http_code === 200) {
    $session_data = json_decode($response, true);
    
    if ($session_data && isset($session_data['id'])) {
        echo json_encode([
            'id' => $session_data['id'],
            'url' => $session_data['url'] ?? null
        ]);
    } else {
        error_log('Stripe Response Invalid: ' . $response);
        http_response_code(500);
        echo json_encode([
            'error' => 'Risposta non valida dal servizio di pagamento'
        ]);
    }
} else {
    // Log errore per debugging
    error_log('Stripe API Error (HTTP ' . $http_code . '): ' . $response);
    
    $error_data = json_decode($response, true);
    $error_message = 'Errore durante la creazione della sessione di pagamento';
    
    if ($error_data && isset($error_data['error']['message'])) {
        $error_message = $error_data['error']['message'];
    }
    
    http_response_code($http_code);
    echo json_encode([
        'error' => $error_message,
        'stripe_error' => $error_data ?? null
    ]);
}
?>