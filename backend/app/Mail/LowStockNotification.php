<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LowStockNotification extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;

    public array $materials;

    public int $threshold;

    public function __construct(User $user, array $materials, int $threshold = 500)
    {
        $this->user = $user;
        $this->materials = $materials;
        $this->threshold = $threshold;
    }

    public function build()
    {
        return $this->subject('⚠️ Peringatan: Stok Raw Material Rendah')
            ->view('emails.low-stock-notification');
    }
}
