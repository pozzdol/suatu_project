<?php

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$raw = App\Models\RawMaterial::find('3d1d6d415d8146e3965f236d7efe3353');

if ($raw) {
    $data = $raw->data ?? [];
    $data['stock'] = 105;
    $raw->data = $data;
    $raw->save();
}
