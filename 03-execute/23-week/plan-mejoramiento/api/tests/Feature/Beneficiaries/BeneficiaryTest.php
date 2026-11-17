<?php

namespace tests\Feature\Beneficiaries;

use App\Models\Beneficiary;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

class BeneficiaryTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Verify that a beneficiary can be created in the database.
     */
    public function test_a_beneficiary_can_be_created_in_the_database(): void
    {
        $beneficiary = Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $beneficiary->id,
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        $this->assertNotNull($beneficiary->created_at);
        $this->assertNotNull($beneficiary->updated_at);

        $this->assertDatabaseCount('beneficiaries', 1);
    }

    /**
     * Verify that beneficiary identification numbers are unique.
     */
    public function test_beneficiary_identification_number_must_be_unique(): void
    {
        Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        try {
            Beneficiary::create([
                'full_name' => 'Maria Lopez',
                'identification_number' => '123456789',
            ]);

            $this->fail(
                'The database allowed a duplicate identification number.'
            );
        } catch (QueryException $exception) {
            $this->assertDatabaseCount('beneficiaries', 1);
        }
    }

    /**
     * Verify that a beneficiary can be retrieved from the database.
     */
    public function test_a_beneficiary_can_be_retrieved_from_the_database(): void
    {
        $beneficiary = Beneficiary::create([
            'full_name' => 'Carlos Ramirez',
            'identification_number' => '987654321',
        ]);

        $retrievedBeneficiary = Beneficiary::find($beneficiary->id);

        $this->assertNotNull($retrievedBeneficiary);
        $this->assertSame('Carlos Ramirez', $retrievedBeneficiary->full_name);
        $this->assertSame(
            '987654321',
            $retrievedBeneficiary->identification_number
        );
    }

    /**
     * Verify that a beneficiary can be updated.
     */
    public function test_a_beneficiary_can_be_updated(): void
    {
        $beneficiary = Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        $beneficiary->update([
            'full_name' => 'Juan Carlos Perez',
            'identification_number' => '123456780',
        ]);

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $beneficiary->id,
            'full_name' => 'Juan Carlos Perez',
            'identification_number' => '123456780',
        ]);
    }

    /**
     * Verify that different beneficiaries can have different identification numbers.
     */
    public function test_multiple_beneficiaries_can_be_registered(): void
    {
        Beneficiary::create([
            'full_name' => 'Juan Perez',
            'identification_number' => '123456789',
        ]);

        Beneficiary::create([
            'full_name' => 'Maria Lopez',
            'identification_number' => '987654321',
        ]);

        $this->assertDatabaseCount('beneficiaries', 2);
    }

    /**
     * Verify that a beneficiary has an available loans relationship.
     */
    public function test_a_beneficiary_can_have_a_loans_relationship(): void
    {
        $beneficiary = Beneficiary::create([
            'full_name' => 'Pedro Gomez',
            'identification_number' => '456789123',
        ]);

        $this->assertCount(0, $beneficiary->loans);
    }

    /**
     * Verify that a beneficiary without loan history cannot be deleted.
     */
    public function test_a_beneficiary_without_loans_cannot_be_deleted(): void
    {
        $beneficiary = Beneficiary::create([
            'full_name' => 'Ana Torres',
            'identification_number' => '789123456',
        ]);

        try {
            $beneficiary->delete();

            $this->fail('The application allowed a beneficiary to be deleted.');
        } catch (LogicException $exception) {
            $this->assertSame(
                'Beneficiaries cannot be deleted.',
                $exception->getMessage()
            );
        }

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $beneficiary->id,
        ]);
    }

    /**
     * Verify that updating a beneficiary preserves its database identity.
     */
    public function test_updating_a_beneficiary_preserves_its_id(): void
    {
        $beneficiary = Beneficiary::create([
            'full_name' => 'Laura Diaz',
            'identification_number' => '321654987',
        ]);

        $originalId = $beneficiary->id;

        $beneficiary->update([
            'full_name' => 'Laura Maria Diaz',
        ]);

        $this->assertSame($originalId, $beneficiary->fresh()->id);

        $this->assertDatabaseCount('beneficiaries', 1);
    }

    /**
     * Verify that deleting one beneficiary does not affect other beneficiaries.
     */
    public function test_deleting_a_beneficiary_does_not_affect_other_beneficiaries(): void
    {
        $firstBeneficiary = Beneficiary::create([
            'full_name' => 'Andres Ruiz',
            'identification_number' => '111222333',
        ]);

        $secondBeneficiary = Beneficiary::create([
            'full_name' => 'Sofia Castro',
            'identification_number' => '444555666',
        ]);

        try {
            $firstBeneficiary->delete();

            $this->fail('The application allowed a beneficiary to be deleted.');
        } catch (LogicException $exception) {
            $this->assertSame(
                'Beneficiaries cannot be deleted.',
                $exception->getMessage()
            );
        }

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $firstBeneficiary->id,
            'full_name' => 'Andres Ruiz',
        ]);

        $this->assertDatabaseHas('beneficiaries', [
            'id' => $secondBeneficiary->id,
            'full_name' => 'Sofia Castro',
        ]);

        $this->assertDatabaseCount('beneficiaries', 2);
    }
}