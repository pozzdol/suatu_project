<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // baca dari ENV dan explode jadi array
    'allowed_origins' => array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', '')))),

    // jika Anda butuh pola wildcard gunakan allowed_origins_patterns
    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    // jika pakai cookie/session (Sanctum stateful) set true
    'supports_credentials' => true,

    'max_age' => 0,
];
