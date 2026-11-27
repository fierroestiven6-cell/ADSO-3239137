<?php

namespace tests\Feature\Loans;

use App\Models\Beneficiary;
use App\Models\Loan;
use App\Models\LoanLine;
use App\Models\TechnicalAid;
use App\Models\TechnicalAidCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
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
            'name' => 'Manager Test',
            'username' => 'manager_test',
            'email' => 'manager@test.com',
            'password' => bcrypt('Password123!'),
            'role' => 'manager',
        ]);

        $this->beneficiary = Beneficiary::create([
            'full_name' => 'Beneficiary Test',
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
            'maintenance_units' => 0,
            'is_active' => true,
        ]);
    }

    // ==========================================
    // REGISTRO DE PRÉSTAMOS
    // ==========================================

    public function test_manager_can_register_a_loan(): void
    {
        Sanctum::actingAs($this->manager);

        $response = $this->postJson('/api/loans', [
            'beneficiary_id' => $this->beneficiary->id,
            'items' => [
                ['technical_aid_id' => $this->technicalAid->id],
            ],
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('technical_aids', [
            'id' => $this->technicalAid->id,
            'available_units' => 4,
        ]);
    }

    public function test_manager_cannot_register_loan_for_beneficiary_with_overdue_items(): void
    {
        Sanctum::actingAs($this->manager);

        $this->createLoan([
            'due_at' => now()->subDays(2),
        ]);

        $response = $this->postJson('/api/loans', [
            'beneficiary_id' => $this->beneficiary->id,
            'items' => [
                ['technical_aid_id' => $this->technicalAid->id],
            ],
        ]);

        $response->assertStatus(409);
    }

    public function test_manager_cannot_register_loan_when_no_units_are_available(): void
    {
        Sanctum::actingAs($this->manager);

        $this->technicalAid->update([
            'available_units' => 0,
        ]);

        $response = $this->postJson('/api/loans', [
            'beneficiary_id' => $this->beneficiary->id,
            'items' => [
                ['technical_aid_id' => $this->technicalAid->id],
            ],
        ]);

        $response->assertStatus(409);
    }

    // ==========================================
    // REGLAS DE NEGOCIO DE LOS PRÉSTAMOS
    // ==========================================

    public function test_manager_cannot_have_more_than_two_pending_items(): void
    {
        Sanctum::actingAs($this->manager);


        $this->createLoan();
        $this->createLoan();


        $response = $this->postJson('/api/loans', [
            'beneficiary_id' => $this->beneficiary->id,
            'items' => [
                ['technical_aid_id' => $this->technicalAid->id],
            ],
        ]);

        $response->assertStatus(422);
    }

    public function test_manager_cannot_register_duplicate_technical_aid_in_same_loan(): void
    {
        Sanctum::actingAs($this->manager);

        $response = $this->postJson('/api/loans', [
            'beneficiary_id' => $this->beneficiary->id,
            'items' => [
                ['technical_aid_id' => $this->technicalAid->id],
                ['technical_aid_id' => $this->technicalAid->id],
            ],
        ]);

        $response->assertStatus(422);
    }

    // ==========================================
    // DEVOLUCIÓN DE AYUDAS TÉCNICAS
    // ==========================================

    public function test_manager_can_return_a_loan_item(): void
    {
        Sanctum::actingAs($this->manager);

        $loan = $this->createLoan();

        $line = $loan->loanLines()->first();

        $response = $this->postJson(
            "/api/loans/{$loan->id}/items/{$line->id}/return"
        );

        $response->assertOk();

        $this->assertNotNull(
            LoanLine::findOrFail($line->id)->returned_at
        );

        $this->assertDatabaseHas('loan_lines', [
            'id' => $line->id,
        ]);

        $this->assertDatabaseHas('technical_aids', [
            'id' => $this->technicalAid->id,
            'available_units' => 5,
            'maintenance_units' => 0,
        ]);
    }

    public function test_manager_can_return_a_loan_item_to_maintenance(): void
    {
        Sanctum::actingAs($this->manager);

        $loan = $this->createLoan();

        $line = $loan->loanLines()->first();

        $response = $this->postJson(
            "/api/loans/{$loan->id}/items/{$line->id}/return",
            [
                'condition' => 'maintenance',
            ]
        );

        $response->assertOk();

        $this->assertNotNull(
            LoanLine::findOrFail($line->id)->returned_at
        );

        $this->assertDatabaseHas('technical_aids', [
            'id' => $this->technicalAid->id,
            'available_units' => 4,
            'maintenance_units' => 1,
        ]);
    }

    public function test_manager_cannot_return_same_item_twice(): void
    {
        Sanctum::actingAs($this->manager);

        $loan = $this->createLoan();

        $line = $loan->loanLines()->first();

        $this->postJson(
            "/api/loans/{$loan->id}/items/{$line->id}/return"
        )->assertOk();

        $this->postJson(
            "/api/loans/{$loan->id}/items/{$line->id}/return"
        )->assertStatus(409);
    }

    // ==========================================
    // MANTENIMIENTO DE AYUDAS TÉCNICAS
    // ==========================================

    public function test_admin_can_complete_technical_aid_maintenance(): void
    {
        $this->technicalAid->update([
            'available_units' => 3,
            'maintenance_units' => 1,
        ]);

        Sanctum::actingAs($this->createAdmin());

        $response = $this->postJson(
            "/api/technical-aids/{$this->technicalAid->id}/maintenance/complete"
        );

        $response->assertOk();

        $this->assertDatabaseHas('technical_aids', [
            'id' => $this->technicalAid->id,
            'available_units' => 4,
            'maintenance_units' => 0,
        ]);
    }

    public function test_manager_cannot_complete_technical_aid_maintenance(): void
    {
        $this->technicalAid->update([
            'available_units' => 3,
            'maintenance_units' => 1,
        ]);

        Sanctum::actingAs($this->manager);

        $response = $this->postJson(
            "/api/technical-aids/{$this->technicalAid->id}/maintenance/complete"
        );

        $response->assertForbidden();

        $this->assertDatabaseHas('technical_aids', [
            'id' => $this->technicalAid->id,
            'available_units' => 3,
            'maintenance_units' => 1,
        ]);
    }

    public function test_admin_cannot_complete_maintenance_when_no_units_are_pending(): void
    {
        Sanctum::actingAs($this->createAdmin());

        $response = $this->postJson(
            "/api/technical-aids/{$this->technicalAid->id}/maintenance/complete"
        );

        $response->assertUnprocessable();

        $this->assertDatabaseHas('technical_aids', [
            'id' => $this->technicalAid->id,
            'available_units' => 5,
            'maintenance_units' => 0,
        ]);
    }

    // ==========================================
    // CONSULTA DEL HISTORIAL
    // ==========================================

    public function test_manager_can_view_loan_history(): void
    {
        Sanctum::actingAs($this->manager);

        $this->createLoan();

        $this->getJson('/api/loans')->assertOk();
    }

    public function test_manager_can_view_loan_details(): void
    {
        Sanctum::actingAs($this->manager);

        $loan = $this->createLoan();

        $this->getJson("/api/loans/{$loan->id}")->assertOk();
    }

    public function test_manager_can_view_closed_loan_history(): void
    {
        Sanctum::actingAs($this->manager);

        $loan = $this->createLoan();
        $line = $loan->loanLines()->first();

        $this->postJson(
            "/api/loans/{$loan->id}/items/{$line->id}/return"
        )->assertOk();

        $this->getJson('/api/loans?status=closed')->assertOk();
    }

    public function test_manager_can_view_overdue_loan_history(): void
    {
        Sanctum::actingAs($this->manager);

        $this->createLoan([
            'due_at' => now()->subDays(2),
        ]);

        $this->getJson('/api/loans?status=overdue')->assertOk();
    }

    public function test_manager_can_view_overdue_loans(): void
    {
        $this->createLoan([
            'due_at' => now()->subDays(2),
        ]);

        Sanctum::actingAs($this->manager);

        $this->getJson('/api/loans/overdue')->assertOk();
    }

    // ==========================================
    // PERMISOS DEL ADMINISTRADOR
    // ==========================================

    public function test_admin_can_register_a_loan(): void
    {
        Sanctum::actingAs($this->createAdmin());

        $response = $this->postJson('/api/loans', [
            'beneficiary_id' => $this->beneficiary->id,
            'items' => [
                ['technical_aid_id' => $this->technicalAid->id],
            ],
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('technical_aids', [
            'id' => $this->technicalAid->id,
            'available_units' => 4,
        ]);
    }

    public function test_admin_can_return_a_loan_item(): void
    {
        $loan = $this->createLoan();
        $line = $loan->loanLines()->first();

        Sanctum::actingAs($this->createAdmin());

        $response = $this->postJson(
            "/api/loans/{$loan->id}/items/{$line->id}/return"
        );

        $response->assertOk();

        $this->assertNotNull(
            LoanLine::findOrFail($line->id)->returned_at
        );

        $this->assertDatabaseHas('technical_aids', [
            'id' => $this->technicalAid->id,
            'available_units' => 5,
            'maintenance_units' => 0,
        ]);
    }

    public function test_admin_can_view_loan_history(): void
    {
        $this->createLoan();

        Sanctum::actingAs($this->createAdmin());

        $this->getJson('/api/loans')->assertOk();
    }

    public function test_admin_can_view_overdue_loans(): void
    {
        $this->createLoan([
            'due_at' => now()->subDays(2),
        ]);

        Sanctum::actingAs($this->createAdmin());

        $this->getJson('/api/loans/overdue')->assertOk();
    }

    // ==========================================
    // MÉTODOS AUXILIARES
    // ==========================================

    private function createLoan(array $lineAttributes = []): Loan
    {
        $loan = Loan::create([
            'beneficiary_id' => $this->beneficiary->id,
            'manager_id' => $this->manager->id,
            'loaned_at' => now(),
        ]);

        LoanLine::create(array_merge([
            'loan_id' => $loan->id,
            'technical_aid_id' => $this->technicalAid->id,
            'reference_snapshot' => $this->technicalAid->reference,
            'category_snapshot' => 'Wheelchairs',
            'due_at' => now()->addDays(30),
            'returned_at' => null,
        ], $lineAttributes));

        $this->technicalAid->decrement('available_units');

        return $loan;
    }

    private function createAdmin(): User
    {
        return User::create([
            'name' => 'Admin Test',
            'username' => 'admin_test',
            'email' => 'admin@test.com',
            'password' => bcrypt('Password123!'),
            'role' => 'admin',
        ]);
    }
}
