<?php

namespace tests\Feature\Loans;

use App\Models\Beneficiary;
use App\Models\Loan;
use App\Models\LoanLine;
use App\Models\TechnicalAid;
use App\Models\TechnicalAidCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoanApiTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;
    private Beneficiary $beneficiary;
    private TechnicalAid $technicalAid;

    protected function setUp(): void
    {
        parent::setUp();

        $this->manager = User::create([
            'name' => 'Loan Manager',
            'username' => 'loanmanager',
            'email' => 'manager@example.com',
            'password' => 'Password123!',
            'role' => 'manager',
        ]);

        $this->beneficiary = Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        $category = TechnicalAidCategory::create([
            'name' => 'Wheelchairs',
        ]);

        $this->technicalAid = TechnicalAid::create([
            'category_id' => $category->id,
            'reference' => 'WH-001',
            'total_units' => 5,
            'available_units' => 5,
            'is_active' => true,
        ]);
    }

    public function test_manager_can_register_a_loan(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/loans', [
                'beneficiary_id' => $this->beneficiary->id,
                'items' => [
                    [
                        'technical_aid_id' => $this->technicalAid->id,
                    ],
                ],
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('loans', [
            'beneficiary_id' => $this->beneficiary->id,
            'manager_id' => $this->manager->id,
        ]);

        $this->assertDatabaseHas('technical_aids', [
            'id' => $this->technicalAid->id,
            'available_units' => 4,
        ]);

        $this->assertDatabaseCount('loan_lines', 1);
    }

    public function test_manager_can_return_a_loan_item(): void
    {
        $loan = $this->createLoan();

        $line = $loan->loanLines()->first();

        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson(
                "/api/loans/{$loan->id}/items/{$line->id}/return"
            );

        $response->assertOk();

        $this->assertDatabaseHas('loan_lines', [
            'id' => $line->id,
        ]);

        $this->assertNotNull(
            LoanLine::findOrFail($line->id)->returned_at
        );

        $this->assertDatabaseHas('technical_aids', [
            'id' => $this->technicalAid->id,
            'available_units' => 5,
        ]);
    }

    public function test_manager_cannot_return_the_same_item_twice(): void
    {
        $loan = $this->createLoan();

        $line = $loan->loanLines()->first();

        $this->actingAs($this->manager, 'sanctum')
            ->postJson(
                "/api/loans/{$loan->id}/items/{$line->id}/return"
            )
            ->assertOk();

        $this->actingAs($this->manager, 'sanctum')
            ->postJson(
                "/api/loans/{$loan->id}/items/{$line->id}/return"
            )
            ->assertStatus(409);
    }

    public function test_manager_cannot_register_a_loan_for_a_beneficiary_with_overdue_items(): void
    {
        $loan = $this->createLoan();

        $line = $loan->loanLines()->first();

        $line->update([
            'due_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/loans', [
                'beneficiary_id' => $this->beneficiary->id,
                'items' => [
                    [
                        'technical_aid_id' => $this->technicalAid->id,
                    ],
                ],
            ]);

        $response->assertStatus(409);
    }

    private function createLoan(): Loan
    {
        $loan = Loan::create([
            'beneficiary_id' => $this->beneficiary->id,
            'manager_id' => $this->manager->id,
            'loaned_at' => now(),
        ]);

        $this->technicalAid->decrement('available_units');

        $loan->loanLines()->create([
            'technical_aid_id' => $this->technicalAid->id,
            'reference_snapshot' => $this->technicalAid->reference,
            'category_snapshot' => 'Wheelchairs',
            'due_at' => now()->addDays(30),
            'returned_at' => null,
        ]);

        return $loan;
    }
}