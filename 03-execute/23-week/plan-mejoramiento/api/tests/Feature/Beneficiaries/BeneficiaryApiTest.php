<?php

namespace tests\Feature\Beneficiaries;

use App\Models\Beneficiary;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BeneficiaryApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Verify that unauthenticated users cannot access beneficiary endpoints.
     */
    public function test_unauthenticated_users_cannot_access_beneficiary_endpoints(): void
    {
        $beneficiary = Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        $this->getJson('/api/beneficiaries')
            ->assertUnauthorized();

        $this->postJson('/api/beneficiaries', [
            'full_name' => 'Maria Lopez',
            'identification_number' => '987654321',
        ])->assertUnauthorized();

        $this->getJson("/api/beneficiaries/{$beneficiary->id}")
            ->assertUnauthorized();

        $this->putJson("/api/beneficiaries/{$beneficiary->id}", [
            'full_name' => 'Juan Carlos Perez',
        ])->assertUnauthorized();

        $this->deleteJson("/api/beneficiaries/{$beneficiary->id}")
            ->assertUnauthorized();
    }

    /**
     * Verify that authenticated users can list beneficiaries.
     */
    public function test_authenticated_users_can_list_beneficiaries(): void
    {
        $user = User::factory()->create();

        Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        Beneficiary::create([
            'full_name' => 'Maria Lopez',
            'identification_number' => '987654321',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/beneficiaries');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'full_name',
                        'identification_number',
                    ],
                ],
            ]);
    }

    /**
     * Verify that authenticated users can register beneficiaries.
     */
    public function test_authenticated_users_can_create_beneficiaries(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/beneficiaries', [
                'full_name' => 'Carlos Ramirez',
                'identification_number' => '456789123',
            ]);

        $response->assertCreated()
            ->assertJsonPath(
                'message',
                'Beneficiary created successfully.'
            )
            ->assertJsonPath(
                'beneficiary.full_name',
                'Carlos Ramirez'
            )
            ->assertJsonPath(
                'beneficiary.identification_number',
                '456789123'
            );

        $this->assertDatabaseHas('beneficiaries', [
            'full_name' => 'Carlos Ramirez',
            'identification_number' => '456789123',
        ]);
    }

    /**
     * Verify that authenticated users can retrieve a beneficiary.
     */
    public function test_authenticated_users_can_show_a_beneficiary(): void
    {
        $user = User::factory()->create();

        $beneficiary = Beneficiary::create([
            'full_name' => 'Ana Torres',
            'identification_number' => '789123456',
        ]);

        $this->actingAs($user)
            ->getJson("/api/beneficiaries/{$beneficiary->id}")
            ->assertOk()
            ->assertJsonPath(
                'beneficiary.id',
                $beneficiary->id
            )
            ->assertJsonPath(
                'beneficiary.full_name',
                'Ana Torres'
            );
    }

    /**
     * Verify that authenticated users can update a beneficiary.
     */
    public function test_authenticated_users_can_update_beneficiaries(): void
    {
        $user = User::factory()->create();

        $beneficiary = Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        $this->actingAs($user)
            ->putJson("/api/beneficiaries/{$beneficiary->id}", [
                'full_name' => 'Juan Carlos Perez',
            ])
            ->assertOk()
            ->assertJsonPath(
                'beneficiary.full_name',
                'Juan Carlos Perez'
            );

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $beneficiary->id,
            'full_name' => 'Juan Carlos Perez',
        ]);
    }

    /**
     * Verify that beneficiaries without loan history cannot be deleted.
     */
    public function test_authenticated_users_cannot_delete_beneficiaries_without_loans(): void
    {
        $user = User::factory()->create();

        $beneficiary = Beneficiary::create([
            'full_name' => 'Laura Diaz',
            'identification_number' => '321654987',
        ]);

        $this->actingAs($user)
            ->deleteJson("/api/beneficiaries/{$beneficiary->id}")
            ->assertStatus(409)
            ->assertJsonPath(
                'message',
                'Beneficiaries cannot be deleted.'
            );

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $beneficiary->id,
            'full_name' => 'Laura Diaz',
        ]);
    }

    /**
     * Verify that beneficiaries with loan history cannot be deleted.
     */
    public function test_beneficiaries_with_loan_history_cannot_be_deleted(): void
    {
        $user = User::factory()->create();

        $beneficiary = Beneficiary::create([
            'full_name' => 'Pedro Gomez',
            'identification_number' => '456789123',
        ]);

        Loan::create([
            'beneficiary_id' => $beneficiary->id,
            'manager_id' => $user->id,
            'loaned_at' => now(),
        ]);

        $this->actingAs($user)
            ->deleteJson("/api/beneficiaries/{$beneficiary->id}")
            ->assertStatus(409)
            ->assertJsonPath(
                'message',
                'Beneficiaries cannot be deleted.'
            );

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $beneficiary->id,
            'full_name' => 'Pedro Gomez',
        ]);
    }

    /**
     * Verify that duplicate identification numbers are rejected.
     */
    public function test_beneficiary_creation_rejects_duplicate_identification_numbers(): void
    {
        $user = User::factory()->create();

        Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        $this->actingAs($user)
            ->postJson('/api/beneficiaries', [
                'full_name' => 'Maria Lopez',
                'identification_number' => '123456789',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'identification_number',
            ]);

        $this->assertDatabaseCount('beneficiaries', 1);
    }

    /**
     * Verify that required fields are validated when creating beneficiaries.
     */
    public function test_beneficiary_creation_requires_valid_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/beneficiaries', [
                'full_name' => '',
                'identification_number' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'full_name',
                'identification_number',
            ]);

        $this->assertDatabaseCount('beneficiaries', 0);
    }

    /**
     * Verify that an empty update request is rejected.
     */
    public function test_beneficiary_update_requires_at_least_one_field(): void
    {
        $user = User::factory()->create();

        $beneficiary = Beneficiary::create([
            'full_name' => 'Sofia Castro',
            'identification_number' => '444555666',
        ]);

        $this->actingAs($user)
            ->putJson("/api/beneficiaries/{$beneficiary->id}", [])
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'At least one field must be provided for the update.'
            );

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $beneficiary->id,
            'full_name' => 'Sofia Castro',
        ]);
    }

    /**
     * Verify that a beneficiary cannot use another beneficiary's identification number.
     */
    public function test_beneficiary_update_rejects_an_identification_number_used_by_another_beneficiary(): void
    {
        $user = User::factory()->create();

        $firstBeneficiary = Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        Beneficiary::create([
            'full_name' => 'Maria Lopez',
            'identification_number' => '987654321',
        ]);

        $this->actingAs($user)
            ->putJson("/api/beneficiaries/{$firstBeneficiary->id}", [
                'identification_number' => '987654321',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'identification_number',
            ]);

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $firstBeneficiary->id,
            'identification_number' => '123456789',
        ]);

        $this->assertDatabaseCount('beneficiaries', 2);
    }

    /**
     * Verify that a beneficiary can keep its own identification number when updating.
     */
    public function test_beneficiary_can_keep_its_own_identification_number_when_updating(): void
    {
        $user = User::factory()->create();

        $beneficiary = Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        $this->actingAs($user)
            ->putJson("/api/beneficiaries/{$beneficiary->id}", [
                'full_name' => 'Juan Carlos Perez',
                'identification_number' => '123456789',
            ])
            ->assertOk()
            ->assertJsonPath(
                'beneficiary.full_name',
                'Juan Carlos Perez'
            )
            ->assertJsonPath(
                'beneficiary.identification_number',
                '123456789'
            );

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $beneficiary->id,
            'full_name' => 'Juan Carlos Perez',
            'identification_number' => '123456789',
        ]);
    }
}