<?php

namespace tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_manager(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/users', [
                'name' => 'Test Manager',
                'username' => 'testmanager',
                'email' => 'manager@example.com',
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
            ]);

        $response->assertCreated()
            ->assertJsonPath('user.name', 'Test Manager')
            ->assertJsonPath('user.username', 'testmanager')
            ->assertJsonPath('user.email', 'manager@example.com')
            ->assertJsonPath('user.role', 'manager')
            ->assertJsonStructure([
                'message',
                'user',
       
                ])
            ->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('token');

        
            $this->assertDatabaseHas('users', [
            'email' => 'manager@example.com',
            'role' => 'manager',
        ]);

        $this->assertDatabaseCount('users', 2);

        $manager = User::where(
            'email',
            'manager@example.com'
        )->firstOrFail();

        $this->assertTrue(
            Hash::check('Password123!', $manager->password)
        );

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_manager_cannot_create_another_manager(): void
    {
        $manager = User::factory()->create([
            'role' => 'manager',
        ]);

        $response = $this->actingAs($manager, 'sanctum')
            ->postJson('/api/users', [
                'name' => 'Another Manager',
                'username' => 'anothermanager',
                'email' => 'another@example.com',
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
            ]);

        $response->assertForbidden();

        $this->assertDatabaseMissing('users', [
            'email' => 'another@example.com',
        ]);
    }

    public function test_guest_cannot_create_a_manager(): void
    {
        $response = $this->postJson('/api/users', [
            'name' => 'Unauthorized Manager',
            'username' => 'unauthorizedmanager',
            'email' => 'unauthorized@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnauthorized();

        $this->assertDatabaseMissing('users', [
            'email' => 'unauthorized@example.com',
        ]);
    }

    public function test_admin_cannot_assign_admin_role_through_api(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/users', [
                'name' => 'Another Admin',
                'username' => 'anotheradmin',
                'email' => 'anotheradmin@example.com',
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
                'role' => 'admin',
            ]);

        $response->assertUnprocessable();

        $this->assertDatabaseMissing('users', [
            'email' => 'anotheradmin@example.com',
        ]);
    }

    public function test_public_registration_is_not_available(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Public User',
            'username' => 'publicuser',
            'email' => 'public@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertNotFound();

        $this->assertDatabaseMissing('users', [
            'email' => 'public@example.com',
        ]);
 
        }
}
