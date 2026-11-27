<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $name = env('MOBILITY_ADMIN_NAME');
        $username = env('MOBILITY_ADMIN_USERNAME');
        $email = env('MOBILITY_ADMIN_EMAIL');
        $password = env('MOBILITY_ADMIN_PASSWORD');

        if (! $name || ! $username || ! $email || ! $password) {
            throw new RuntimeException(
                'Administrator credentials are missing from the environment.'
            );
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'username' => $username,
                'password' => Hash::make($password),
                'role' => 'admin',
            ]
        );
    }
}
