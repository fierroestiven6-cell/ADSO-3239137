<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->createInitialAdministrator();

        $this->call([
            TechnicalAidCategorySeeder::class,
        ]);
    }

    /**
     * Create the initial administrator using environment configuration.
     */
    private function createInitialAdministrator(): void
    {
        $admin = config('app.admin');

        $values = [
            'name' => $admin['name'] ?? null,
            'username' => $admin['username'] ?? null,
            'email' => $admin['email'] ?? null,
            'password' => $admin['password'] ?? null,
        ];

        $provided = array_filter(
            $values,
            fn ($value) => filled($value)
        );

        if ($provided === []) {
            return;
        }

        if (count($provided) !== count($values)) {
            throw new RuntimeException(
                'All ADMIN environment variables must be configured.'
            );
        }

        if (
            ! filter_var($values['email'], FILTER_VALIDATE_EMAIL) ||
            strlen($values['username']) > 50 ||
            strlen($values['password']) < 8
        ) {
            throw new RuntimeException(
                'The initial administrator configuration is invalid.'
            );
        }

        $existingByEmail = User::where(
            'email',
            $values['email']
        )->first();

        $existingByUsername = User::where(
            'username',
            $values['username']
        )->first();

        if ($existingByEmail || $existingByUsername) {
            if (
                $existingByEmail &&
                $existingByUsername &&
                $existingByEmail->is($existingByUsername) &&
                $existingByEmail->role === 'admin'
            ) {
                return;
            }

            throw new RuntimeException(
                'The administrator email or username is already in use.'
            );
        }

        User::create([
            'name' => $values['name'],
            'username' => $values['username'],
            'email' => $values['email'],
            'password' => $values['password'],
            'role' => 'admin',
        ]);
    }
}
