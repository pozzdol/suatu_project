<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse;

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $email = base64_decode($data['email'], true) ?: $data['email'];
        $password = base64_decode($data['password'], true) ?: $data['password'];

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->apiError('Email address is not valid.', null, 422);
        }

        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return $this->apiError('Invalid credentials.', null, 401);
        }

        // if (! $user->is_active) {
        //     return $this->apiError('Account is not active.', null, 403);
        // }

        $expiresAt = Carbon::now()->addHours(6);
        $plain = $user->createToken('api', ['*'], $expiresAt)->plainTextToken;

        $minutes = 6 * 60;
        $secure = config('app.env') !== 'local';
        $cookieToken = cookie('COOKIE', $plain, $minutes, '/', null, $secure, false, false, 'Lax');
        $cookieExpiry = cookie('COOKIE_EXPIRY', $expiresAt->toDateTimeString(), $minutes, '/', null, $secure, false, false, 'Lax');

        $payload = [
            'token' => $plain,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toDateTimeString(),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ];

        return $this->apiResponse($payload, 'Logged in successfully')
            ->withCookie($cookieToken)
            ->withCookie($cookieExpiry);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        // create forget cookies for both names and return both
        $forgetToken = cookie()->forget('COOKIE');
        $forgetExpiry = cookie()->forget('COOKIE_EXPIRY');

        return $this->apiResponse(null, 'Logged out successfully')
            ->withCookie($forgetToken)
            ->withCookie($forgetExpiry);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return $this->apiResponse($user);
    }
}
