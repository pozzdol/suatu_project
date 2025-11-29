<?php

use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

/** @var \App\Http\Controllers\OrdersController $controller */
$controller = app(\App\Http\Controllers\OrdersController::class);

$request = Request::create('/', 'PUT', ['status' => 'confirm']);
$response = $controller->update($request, '30897661-1fb7-492d-83c6-7af398dbbecb');

echo json_encode($response->getData(true), JSON_PRETTY_PRINT).PHP_EOL;
