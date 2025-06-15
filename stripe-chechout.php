<?php
// stripe-checkout.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Stripe Secret Key
$stripe_secret_key = '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';

// Ricevi dati dal frontend
$input = json_decode(file_get_contents('php://input'), true);

$customer_name = $input['customerName'] ?? '';
$pickup_date = $input['pickupDate'] ?? '';
$amount = $input['amount'] ?? 0;
$items = $input['items'] ?? [];

// Validazione
if (empty($customer_name) || empty($pickup_date) || $amount <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Dati mancanti']);
    exit;
}

// Crea sessione Stripe Checkout
$checkout_session_data = [
    'payment_method_types' => ['card'],
    'line_items' => [[
        'price_data' => [
            'currency' => 'eur',
            'product_data' => [
                'name' => 'Ordine Pasto Sano - ' . $customer_name,
                'description' => 'Ritiro: ' . $pickup_date
            ],
            'unit_amount' => $amount * 100, // Stripe usa centesimi
        ],
        'quantity' => 1,
    ]],
    'mode' => 'payment',
    'success_url' => $input['success_url'] ?? 'https://pastosano.netlify.app/success.html',
    'cancel_url' => $input['cancel_url'] ?? 'https://pastosano.netlify.app/',
    'metadata' => [
        'customer_name' => $customer_name,
        'pickup_date' => $pickup_date,
        'order_details' => json_encode($items)
    ]
];

// Chiamata API Stripe
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/checkout/sessions');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($checkout_session_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $stripe_secret_key,
    'Content-Type: application/x-www-form-urlencoded'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code === 200) {
    echo $response;
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Errore creazione sessione Stripe']);
}
?>