<?php

namespace tests\Feature\TechnicalAids;

use App\Models\Loan;
use App\Models\LoanLine;
use App\Models\TechnicalAid;
use App\Models\TechnicalAidCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TechnicalAidApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create a technical aid category for testing.
     */
    private function createCategory(): TechnicalAidCategory
    {
        return TechnicalAidCategory::firstOrCreate([
            'name' => 'Wheelchairs',
        ]);
    }

    /**
     * Create a technical aid with the specified inventory.
     */
    private function createTechnicalAid(
        int $totalUnits = 5,
        int $availableUnits = 5,
        bool $isActive = true
    ): TechnicalAid {
        return TechnicalAid::create([
            'category_id' => $this->createCategory()->id,
            'name' => 'Test Technical Aid',
            'reference' => 'TA-' . fake()->unique()->numerify('#####'),
            'total_units' => $totalUnits,
            'available_units' => $availableUnits,
            'maintenance_units' => 0,
            'is_active' => $isActive,
        ]);
    }

    /**
     * Create an administrator user.
     */
    private function createAdmin(): User
    {
        return User::factory()->state([
            'role' => 'admin',
        ])->create();
    }

    /**
     * Verify that unauthenticated users cannot access technical aid endpoints.
     */
    public function test_unauthenticated_users_cannot_access_technical_aid_endpoints(): void
    {
        $aid = $this->createTechnicalAid();

        $this->getJson('/api/technical-aids')
            ->assertUnauthorized();

        $this->getJson("/api/technical-aids/{$aid->id}")
            ->assertUnauthorized();

        $this->postJson('/api/technical-aids', [])
            ->assertUnauthorized();

        $this->putJson("/api/technical-aids/{$aid->id}", [])
            ->assertUnauthorized();

        $this->deleteJson("/api/technical-aids/{$aid->id}")
            ->assertUnauthorized();
    }

    /**
     * Verify that authenticated users can list active technical aids.
     */
    public function test_authenticated_users_can_list_active_technical_aids(): void
    {
        $manager = User::factory()->create();

        $this->createTechnicalAid();
        $this->createTechnicalAid(isActive: false);

        $this->actingAs($manager)
            ->getJson('/api/technical-aids')
            ->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonStructure([
                'items' => [
                    '*' => [
                        'id',
                        'category_id',
                        'reference',
                        'total_units',
                        'available_units',
                        'maintenance_units',
                        'is_active',
                        'category',
                    ],
                ],
                'page',
                'size',
                'total',
            ]);
    }

    /**
     * Verify that authenticated users can filter technical aids by reference.
     */
    public function test_authenticated_users_can_search_technical_aids_by_reference(): void
    {
        $manager = User::factory()->create();

        $aid = TechnicalAid::create([
            'category_id' => $this->createCategory()->id,
            'name' => 'Test Technical Aid',
            'reference' => 'WHEELCHAIR-001',
            'total_units' => 5,
            'available_units' => 5,
            'maintenance_units' => 0,
            'is_active' => true,
        ]);

        $this->createTechnicalAid();

        $this->actingAs($manager)
            ->getJson('/api/technical-aids?q=WHEELCHAIR')
            ->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.id', $aid->id);
    }

    /**
     * Verify that authenticated users can retrieve a technical aid.
     */
    public function test_authenticated_users_can_show_a_technical_aid(): void
    {
        $manager = User::factory()->create();
        $aid = $this->createTechnicalAid();

        $this->actingAs($manager)
            ->getJson("/api/technical-aids/{$aid->id}")
            ->assertOk()
            ->assertJsonPath('technical_aid.id', $aid->id);
    }

    /**
     * Verify that administrators can create technical aids.
     */
    public function test_administrators_can_create_technical_aids(): void
    {
        $admin = $this->createAdmin();
        $category = $this->createCategory();

        $this->actingAs($admin)
            ->postJson('/api/technical-aids', [
                'category_id' => $category->id,
                'name' => 'Silla de ruedas',
                'reference' => 'TA-10001',
                'total_units' => 10,
            ])
            ->assertCreated()
            ->assertJsonPath('technical_aid.reference', 'TA-10001')
            ->assertJsonPath('technical_aid.total_units', 10)
            ->assertJsonPath('technical_aid.available_units', 10)
            ->assertJsonPath('technical_aid.maintenance_units', 0);

        $this->assertDatabaseHas('technical_aids', [
            'reference' => 'TA-10001',
            'total_units' => 10,
            'available_units' => 10,
            'maintenance_units' => 0,
            'is_active' => true,
        ]);
    }

    /**
     * Verify that managers cannot create technical aids.
     */
    public function test_managers_cannot_create_technical_aids(): void
    {
        $manager = User::factory()->create();

        $this->actingAs($manager)
            ->postJson('/api/technical-aids', [
                'category_id' => $this->createCategory()->id,
                'name' => 'Silla de ruedas',
                'reference' => 'TA-10002',
                'total_units' => 5,
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('technical_aids', 0);
    }

    /**
     * Verify that duplicate technical aid references return HTTP 409.
     */
    public function test_technical_aid_creation_rejects_duplicate_references(): void
    {
        $admin = $this->createAdmin();
        $aid = $this->createTechnicalAid();

        $this->actingAs($admin)
            ->postJson('/api/technical-aids', [
                'category_id' => $aid->category_id,
                'name' => 'Silla de ruedas duplicada',
                'reference' => $aid->reference,
                'total_units' => 5,
            ])
            ->assertConflict();

        $this->assertDatabaseCount('technical_aids', 1);
    }

    /**
     * Verify that technical aid creation validates required fields and quantities.
     */
    public function test_technical_aid_creation_requires_valid_fields(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->postJson('/api/technical-aids', [
                'category_id' => '',
                'name' => '',
                'reference' => '',
                'total_units' => 0,
                'maintenance_units' => -1,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'category_id',
                'name',
                'reference',
                'total_units',
                'maintenance_units',
            ]);

        $this->assertDatabaseCount('technical_aids', 0);
    }

    /**
     * Verify that administrators can update technical aid inventory.
     */
    public function test_administrators_can_update_technical_aid_inventory(): void
    {
        $admin = $this->createAdmin();

        $aid = $this->createTechnicalAid(
            totalUnits: 5,
            availableUnits: 3
        );

        $this->actingAs($admin)
            ->putJson("/api/technical-aids/{$aid->id}", [
                'total_units' => 6,
            ])
            ->assertOk()
            ->assertJsonPath('technical_aid.total_units', 6)
            ->assertJsonPath('technical_aid.available_units', 4)
            ->assertJsonPath('technical_aid.maintenance_units', 0);

        $this->assertDatabaseHas('technical_aids', [
            'id' => $aid->id,
            'total_units' => 6,
            'available_units' => 4,
            'maintenance_units' => 0,
        ]);
    }

    /**
     * Verify that inventory cannot be reduced below borrowed units.
     */
    public function test_inventory_cannot_be_reduced_below_borrowed_units(): void
    {
        $admin = $this->createAdmin();

        $aid = $this->createTechnicalAid(
            totalUnits: 5,
            availableUnits: 2
        );

        $this->actingAs($admin)
            ->putJson("/api/technical-aids/{$aid->id}", [
                'total_units' => 2,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['total_units']);

        $this->assertDatabaseHas('technical_aids', [
            'id' => $aid->id,
            'total_units' => 5,
            'available_units' => 2,
        ]);
    }

    /**
     * Verify that managers cannot update technical aids.
     */
    public function test_managers_cannot_update_technical_aids(): void
    {
        $manager = User::factory()->create();
        $aid = $this->createTechnicalAid();

        $this->actingAs($manager)
            ->putJson("/api/technical-aids/{$aid->id}", [
                'total_units' => 10,
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('technical_aids', [
            'id' => $aid->id,
            'total_units' => 5,
        ]);
    }

    /**
     * Verify that administrators can logically deactivate technical aids.
     */
    public function test_administrators_can_deactivate_technical_aids(): void
    {
        $admin = $this->createAdmin();
        $aid = $this->createTechnicalAid();

        $this->actingAs($admin)
            ->deleteJson("/api/technical-aids/{$aid->id}")
            ->assertOk();

        $this->assertDatabaseHas('technical_aids', [
            'id' => $aid->id,
            'is_active' => false,
        ]);
    }

    /**
     * Verify that technical aids with outstanding loans cannot be deactivated.
     */
    public function test_technical_aids_with_outstanding_loans_cannot_be_deactivated(): void
    {
        $admin = $this->createAdmin();
        $aid = $this->createTechnicalAid();

        $beneficiary = \App\Models\Beneficiary::create([
            'full_name' => 'Test Beneficiary',
            'identification_number' => 'TEST-001',
        ]);

        $loan = Loan::create([
            'beneficiary_id' => $beneficiary->id,
            'manager_id' => $admin->id,
            'loaned_at' => now(),
        ]);

        LoanLine::create([
            'loan_id' => $loan->id,
            'technical_aid_id' => $aid->id,
            'reference_snapshot' => $aid->reference,
            'category_snapshot' => $aid->category->name,
            'due_at' => now()->addDays(30),
            'returned_at' => null,
        ]);

        $this->actingAs($admin)
            ->deleteJson("/api/technical-aids/{$aid->id}")
            ->assertStatus(409);

        $this->assertDatabaseHas('technical_aids', [
            'id' => $aid->id,
            'is_active' => true,
        ]);
    }

    /**
     * Verify that managers cannot deactivate technical aids.
     */
    public function test_managers_cannot_deactivate_technical_aids(): void
    {
        $manager = User::factory()->create();
        $aid = $this->createTechnicalAid();

        $this->actingAs($manager)
            ->deleteJson("/api/technical-aids/{$aid->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('technical_aids', [
            'id' => $aid->id,
            'is_active' => true,
        ]);
    }
}
