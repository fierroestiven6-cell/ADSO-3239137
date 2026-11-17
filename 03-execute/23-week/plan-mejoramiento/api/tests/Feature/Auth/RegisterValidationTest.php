<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisterValidationTest extends TestCase
{
    use RefreshDatabase;

    private function authenticateAsAdmin(): void
    {
        $admin = User::create([
            'name' => 'Test Administrator',
            'username' => 'testadmin',
            'email' => 'admin@example.com',
            'password' => 'Password123!',
            'role' => 'admin',
        ]);

        $this->actingAs($admin, 'sanctum');
    }

    public function test_registration_requires_all_mandatory_fields(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'username',
                'email',
                'password',
            ]);

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

  
    public function test_registration_rejects_blank_values(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => '   ',
            'username' => '   ',
            'email' => '   ',
            'password' => '   ',
            'password_confirmation' => '   ',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'username',
                'email',
                'password',
            ]);

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

  
    public function test_registration_rejects_an_existing_email(): void
    {
        User::create([
            'name' => 'Existing Manager',
            'username' => 'existingmanager',
            'email' => 'manager@example.com',
            'password' => 'Password123!',
            'role' => 'manager',
        ]);

        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => 'newmanager',
            'email' => 'manager@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

 
    public function test_registration_rejects_an_existing_username(): void
    {
        User::create([
            'name' => 'Existing Manager',
            'username' => 'existingmanager',
            'email' => 'manager@example.com',
            'password' => 'Password123!',
            'role' => 'manager',
        ]);

        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => 'existingmanager',
            'email' => 'newmanager@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);

        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

   
    public function test_registration_rejects_a_short_password(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => 'newmanager',
            'email' => 'newmanager@example.com',
            'password' => '123',
            'password_confirmation' => '123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    
    public function test_registration_rejects_an_invalid_email_format(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => 'newmanager',
            'email' => 'correo-invalido',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('users', 1);
    }

    
    public function test_registration_rejects_password_confirmation_mismatch(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => 'newmanager',
            'email' => 'newmanager@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseCount('users', 1);
    }

    
    public function test_registration_requires_password_confirmation(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => 'newmanager',
            'email' => 'newmanager@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseCount('users', 1);
    }

    
    public function test_registration_rejects_a_non_string_name(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 12345,
            'username' => 'newmanager',
            'email' => 'newmanager@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $this->assertDatabaseCount('users', 1);
    }

    
    public function test_registration_rejects_a_non_string_username(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => 12345,
            'email' => 'newmanager@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);

        $this->assertDatabaseCount('users', 1);
    }

   
    public function test_registration_rejects_a_non_string_email(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => 'newmanager',
            'email' => 12345,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('users', 1);
    }

   
    public function test_registration_rejects_a_name_exceeding_maximum_length(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => str_repeat('A', 256),
            'username' => 'newmanager',
            'email' => 'newmanager@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $this->assertDatabaseCount('users', 1);
    }

    
    public function test_registration_rejects_a_username_exceeding_maximum_length(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => str_repeat('a', 51),
            'email' => 'newmanager@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);

        $this->assertDatabaseCount('users', 1);
    }

  
    public function test_registration_rejects_an_email_exceeding_maximum_length(): void
    {
        $this->authenticateAsAdmin();

        $longEmail = str_repeat('a', 244).'@example.com';

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => 'newmanager',
            'email' => $longEmail,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('users', 1);
    }

   
    public function test_registration_rejects_a_non_string_password(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'username' => 'newmanager',
            'email' => 'newmanager@example.com',
            'password' => ['Password123!'],
            'password_confirmation' => ['Password123!'],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
