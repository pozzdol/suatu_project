<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Routing\Controller;

class AuthController extends Controller
{
    use ApiResponse;

    public function profile()
    {
        $user = Auth::user();

        if (! $user) {
            return $this->apiError('User not found.', null, 404);
        }

        return $this->apiResponse($user);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $email = base64_decode($data['email'], true) ?: $data['email'];
        $password = base64_decode($data['password'], true) ?: $data['password'];
        $remember = $data['remember'] ?? false;

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

        $expiresAt = $remember ? Carbon::now()->addYear() : Carbon::now()->addHours(6);
        $plain = $user->createToken('api', ['*'], $expiresAt)->plainTextToken;

        $minutes = $remember ? (60 * 24 * 365) : (6 * 60);
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
            'remember' => (bool) $remember,
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
