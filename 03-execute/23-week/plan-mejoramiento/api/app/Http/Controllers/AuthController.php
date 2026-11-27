<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:50', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'manager',
        ]);

        $token = $user->createToken('mobility-aids-token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Authenticate an existing user.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        $token = $user->createToken('mobility-aids-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Send a six-digit password recovery code.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = strtolower(trim($validated['email']));

        $rateLimitKey = 'password-recovery:' . sha1(
            $email . '|' . $request->ip()
        );

        if (RateLimiter::tooManyAttempts($rateLimitKey, 3)) {
            return response()->json([
                'message' => 'Has solicitado demasiados códigos. Inténtalo más tarde.',
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 600);

        $user = User::where('email', $email)->first();

        // Do not reveal whether an email belongs to an account.
        if (! $user) {
            return response()->json([
                'message' => 'Si el correo está registrado, recibirás un código de recuperación.',
            ]);
        }

        $code = (string) random_int(100000, 999999);

        DB::table('password_reset_codes')
            ->where('email', $email)
            ->delete();

        DB::table('password_reset_codes')->insert([
            'email' => $email,
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            Mail::raw(
                "Tu código de recuperación de Mobility Aids es: {$code}\n\n"
                . "Este código vence en 10 minutos y solo puede utilizarse una vez.\n"
                . "Si no solicitaste este cambio, ignora este mensaje.",
                function ($message) use ($email) {
                    $message->to($email)
                        ->subject('Código de recuperación - Mobility Aids');
                }
            );
        } catch (\Throwable $exception) {
            DB::table('password_reset_codes')
                ->where('email', $email)
                ->delete();

            report($exception);

            return response()->json([
                'message' => 'No fue posible enviar el correo. Verifica la configuración del servidor de correo.',
            ], 500);
        }

        return response()->json([
            'message' => 'Si el correo está registrado, recibirás un código de recuperación.',
        ]);
    }

    /**
     * Validate the recovery code and update the password.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
            'password' => [
                'required',
                'confirmed',
                Password::min(10)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        $email = strtolower(trim($validated['email']));

        $user = User::where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No se encontró una cuenta asociada a este correo.'],
            ]);
        }

        DB::transaction(function () use ($email, $validated, $user) {

            $record = DB::table('password_reset_codes')
                ->where('email', $email)
                ->lockForUpdate()
                ->first();

            if (
                ! $record ||
                now()->greaterThanOrEqualTo($record->expires_at) ||
                ! Hash::check($validated['code'], $record->code)
            ) {
                throw ValidationException::withMessages([
                    'code' => ['El código es incorrecto o ha vencido. Solicita uno nuevo.'],
                ]);
            }

            $user->password = Hash::make($validated['password']);
            $user->save();

            // Revoke existing access tokens.
            $user->tokens()->delete();

            // The recovery code can only be used once.
            DB::table('password_reset_codes')
                ->where('email', $email)
                ->delete();
        });

        RateLimiter::clear(
            'password-recovery:' . sha1($email . '|' . $request->ip())
        );

        return response()->json([
            'message' => 'Tu contraseña se ha actualizado correctamente.',
        ]);
    }

    /**
     * Revoke the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }
}
