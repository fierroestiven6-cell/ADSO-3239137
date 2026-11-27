<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    private const TABLES = [
        'users',
        'beneficiaries',
        'technical_aid_categories',
        'technical_aids',
        'loans',
        'loan_lines',
    ];

    private const FOREIGN_COLUMNS = [
        'technical_aids' => [
            'category_id' => false,
        ],
        'loans' => [
            'beneficiary_id' => false,
            'manager_id' => false,
        ],
        'loan_lines' => [
            'loan_id' => false,
            'technical_aid_id' => false,
        ],
        'sessions' => [
            'user_id' => true,
        ],
        'personal_access_tokens' => [
            'tokenable_id' => false,
        ],
    ];

    private const FOREIGN_KEYS = [
        'loan_lines_loan_id_foreign' => [
            'table' => 'loan_lines',
            'column' => 'loan_id',
            'referenced_table' => 'loans',
            'delete_rule' => 'RESTRICT',
        ],
        'loan_lines_technical_aid_id_foreign' => [
            'table' => 'loan_lines',
            'column' => 'technical_aid_id',
            'referenced_table' => 'technical_aids',
            'delete_rule' => 'RESTRICT',
        ],
        'loans_beneficiary_id_foreign' => [
            'table' => 'loans',
            'column' => 'beneficiary_id',
            'referenced_table' => 'beneficiaries',
            'delete_rule' => 'RESTRICT',
        ],
        'loans_manager_id_foreign' => [
            'table' => 'loans',
            'column' => 'manager_id',
            'referenced_table' => 'users',
            'delete_rule' => 'RESTRICT',
        ],
        'technical_aids_category_id_foreign' => [
            'table' => 'technical_aids',
            'column' => 'category_id',
            'referenced_table' => 'technical_aid_categories',
            'delete_rule' => 'NO ACTION',
        ],
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Validate the complete schema before changing anything.
        $this->assertTablesExist();
        $this->assertTableEngines();
        $this->assertPreservedIndexesAndConstraints();

        $primaryTypes = [];

        foreach (self::TABLES as $table) {
            $column = $this->columnInfo($table, 'id');

            if (!$column || $column->IS_NULLABLE !== 'NO'
                || $column->COLUMN_KEY !== 'PRI') {
                throw new RuntimeException(
                    "Unexpected primary key definition in {$table}."
                );
            }

            $primaryTypes[$table] = strtolower($column->COLUMN_TYPE);
        }

        $foreignTypes = [];

        foreach (self::FOREIGN_COLUMNS as $table => $columns) {
            foreach ($columns as $column => $nullable) {
                $info = $this->columnInfo($table, $column);

                if (!$info) {
                    throw new RuntimeException(
                        "Missing expected column: {$table}.{$column}"
                    );
                }

                $expectedNullability = $nullable ? 'YES' : 'NO';

                if ($info->IS_NULLABLE !== $expectedNullability) {
                    throw new RuntimeException(
                        "Unexpected nullability in {$table}.{$column}."
                    );
                }

                $foreignTypes["{$table}.{$column}"] =
                    strtolower($info->COLUMN_TYPE);
            }
        }

        $allTypes = array_merge($primaryTypes, $foreignTypes);

        $isLegacy = count(array_filter(
            $allTypes,
            fn ($type) => $type === 'bigint unsigned'
        )) === count($allTypes);

        $isUuid = count(array_filter(
            $allTypes,
            fn ($type) => $type === 'char(36)'
        )) === count($allTypes);

        if ($isUuid) {
            $this->assertUuidColumnDefinitions();
            $this->assertForeignKeys();

            // A complete conversion is already present.
            return;
        }

        if (!$isLegacy) {
            throw new RuntimeException(
                'The database contains a mixed or partially converted UUID schema. '
                . 'No changes were made. Inspect the database before proceeding.'
            );
        }

        $this->assertLegacyPrimaryKeys();
        $this->assertLegacyForeignColumns();
        $this->assertForeignKeys();

        // Refuse conversion if any dependent table contains records.
        $dependentTables = [
            'technical_aids',
            'loans',
            'loan_lines',
            'personal_access_tokens',
            'sessions',
        ];

        foreach ($dependentTables as $table) {
            if (DB::table($table)->exists()) {
                throw new RuntimeException(
                    "The table {$table} contains records. "
                    . 'Conversion stopped without changing the schema.'
                );
            }
        }

        // Build UUID v4 mappings before executing any DDL.
        $idMaps = [];

        foreach (self::TABLES as $table) {
            $idMaps[$table] = [];

            foreach (DB::table($table)->pluck('id') as $oldId) {
                $uuid = (string) Str::uuid();

                if (substr($uuid, 14, 1) !== '4') {
                    throw new RuntimeException(
                        'UUID v4 generation validation failed.'
                    );
                }

                // Keep the legacy identifier as a string value, not an array key.
                // PHP converts numeric-string array keys (for example, "1") to integers.
                $idMaps[$table][] = [
                    'old_id' => (string) $oldId,
                    'new_id' => (string) $uuid,
                ];
            }
        }

        // Drop only the five previously verified foreign keys.
        foreach (self::FOREIGN_KEYS as $name => $definition) {
            DB::statement(
                "ALTER TABLE `{$definition['table']}` "
                . "DROP FOREIGN KEY `{$name}`"
            );
        }

        // Convert the six primary keys.
        foreach (self::TABLES as $table) {
            DB::statement(
                "ALTER TABLE `{$table}` "
                . "MODIFY `id` CHAR(36) CHARACTER SET utf8mb4 "
                . "COLLATE utf8mb4_unicode_ci NOT NULL"
            );
        }

        // Replace existing primary key values.
        foreach ($idMaps as $table => $mapping) {
            foreach ($mapping as $pair) {
                $updated = DB::table($table)
                    ->where('id', '=', (string) $pair['old_id'])
                    ->update(['id' => $pair['new_id']]);

                if ($updated !== 1) {
                    throw new RuntimeException(
                        "Could not update the identifier in {$table}. "
                        . 'The conversion may be incomplete. Do not rerun it blindly.'
                    );
                }
            }
        }

        // Convert the five dependent foreign-key columns.
        DB::statement(
            'ALTER TABLE technical_aids
             MODIFY category_id CHAR(36)
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
        );

        DB::statement(
            'ALTER TABLE loans
             MODIFY beneficiary_id CHAR(36)
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
             MODIFY manager_id CHAR(36)
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
        );

        DB::statement(
            'ALTER TABLE loan_lines
             MODIFY loan_id CHAR(36)
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
             MODIFY technical_aid_id CHAR(36)
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
        );

        // Convert Laravel sessions and Sanctum token identifiers.
        DB::statement(
            'ALTER TABLE sessions
             MODIFY user_id CHAR(36)
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL'
        );

        DB::statement(
            'ALTER TABLE personal_access_tokens
             MODIFY tokenable_id CHAR(36)
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
        );

        // Restore the five original foreign-key relationships.
        DB::statement(
            'ALTER TABLE technical_aids
             ADD CONSTRAINT technical_aids_category_id_foreign
             FOREIGN KEY (category_id)
             REFERENCES technical_aid_categories(id)'
        );

        DB::statement(
            'ALTER TABLE loans
             ADD CONSTRAINT loans_beneficiary_id_foreign
             FOREIGN KEY (beneficiary_id)
             REFERENCES beneficiaries(id)
             ON DELETE RESTRICT'
        );

        DB::statement(
            'ALTER TABLE loans
             ADD CONSTRAINT loans_manager_id_foreign
             FOREIGN KEY (manager_id)
             REFERENCES users(id)
             ON DELETE RESTRICT'
        );

        DB::statement(
            'ALTER TABLE loan_lines
             ADD CONSTRAINT loan_lines_loan_id_foreign
             FOREIGN KEY (loan_id)
             REFERENCES loans(id)
             ON DELETE RESTRICT'
        );

        DB::statement(
            'ALTER TABLE loan_lines
             ADD CONSTRAINT loan_lines_technical_aid_id_foreign
             FOREIGN KEY (technical_aid_id)
             REFERENCES technical_aids(id)
             ON DELETE RESTRICT'
        );

        // Verify the resulting schema before allowing the migration to finish.
        $this->assertUuidColumnDefinitions();
        $this->assertForeignKeys();
        $this->assertPreservedIndexesAndConstraints();

        foreach (self::TABLES as $table) {
            foreach (DB::table($table)->pluck('id') as $id) {
                $id = (string) $id;

                if (!Str::isUuid($id) || substr($id, 14, 1) !== '4') {
                    throw new RuntimeException(
                        "A primary key in {$table} is not a valid UUID v4."
                    );
                }
            }
        }
    }

    private function assertTablesExist(): void
    {
        $tables = array_merge(
            self::TABLES,
            ['sessions', 'personal_access_tokens']
        );

        foreach ($tables as $table) {
            $exists = DB::selectOne(
                'SELECT TABLE_NAME
                 FROM INFORMATION_SCHEMA.TABLES
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = ?',
                [$table]
            );

            if (!$exists) {
                throw new RuntimeException(
                    "Required table is missing: {$table}"
                );
            }
        }
    }

    private function assertTableEngines(): void
    {
        $tables = array_merge(
            self::TABLES,
            ['sessions', 'personal_access_tokens']
        );

        foreach ($tables as $table) {
            $info = DB::selectOne(
                'SELECT ENGINE, TABLE_COLLATION
                 FROM INFORMATION_SCHEMA.TABLES
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = ?',
                [$table]
            );

            if (!$info
                || $info->ENGINE !== 'InnoDB'
                || $info->TABLE_COLLATION !== 'utf8mb4_unicode_ci') {
                throw new RuntimeException(
                    "Unexpected engine or collation in {$table}."
                );
            }
        }
    }

    private function columnInfo(string $table, string $column): ?object
    {
        return DB::selectOne(
            'SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA,
                    CHARACTER_SET_NAME, COLLATION_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?',
            [$table, $column]
        );
    }

    private function assertLegacyPrimaryKeys(): void
    {
        foreach (self::TABLES as $table) {
            $info = $this->columnInfo($table, 'id');

            if (strtolower($info->COLUMN_TYPE) !== 'bigint unsigned'
                || !str_contains($info->EXTRA, 'auto_increment')) {
                throw new RuntimeException(
                    "Unexpected legacy primary key in {$table}."
                );
            }
        }
    }

    private function assertLegacyForeignColumns(): void
    {
        foreach (self::FOREIGN_COLUMNS as $table => $columns) {
            foreach ($columns as $column => $nullable) {
                $info = $this->columnInfo($table, $column);

                if (strtolower($info->COLUMN_TYPE) !== 'bigint unsigned') {
                    throw new RuntimeException(
                        "Unexpected legacy type in {$table}.{$column}."
                    );
                }
            }
        }
    }

    private function assertUuidColumnDefinitions(): void
    {
        foreach (self::TABLES as $table) {
            $info = $this->columnInfo($table, 'id');

            if (!$info
                || strtolower($info->COLUMN_TYPE) !== 'char(36)'
                || $info->IS_NULLABLE !== 'NO'
                || $info->COLUMN_KEY !== 'PRI'
                || str_contains($info->EXTRA, 'auto_increment')
                || $info->CHARACTER_SET_NAME !== 'utf8mb4'
                || $info->COLLATION_NAME !== 'utf8mb4_unicode_ci') {
                throw new RuntimeException(
                    "Invalid UUID primary key definition in {$table}."
                );
            }
        }

        foreach (self::FOREIGN_COLUMNS as $table => $columns) {
            foreach ($columns as $column => $nullable) {
                $info = $this->columnInfo($table, $column);
                $expectedNullability = $nullable ? 'YES' : 'NO';

                if (!$info
                    || strtolower($info->COLUMN_TYPE) !== 'char(36)'
                    || $info->IS_NULLABLE !== $expectedNullability
                    || $info->CHARACTER_SET_NAME !== 'utf8mb4'
                    || $info->COLLATION_NAME !== 'utf8mb4_unicode_ci') {
                    throw new RuntimeException(
                        "Invalid UUID column definition in {$table}.{$column}."
                    );
                }
            }
        }
    }

    private function assertForeignKeys(): void
    {
        $actual = DB::select(
            'SELECT
                k.CONSTRAINT_NAME,
                k.TABLE_NAME,
                k.COLUMN_NAME,
                k.REFERENCED_TABLE_NAME,
                k.REFERENCED_COLUMN_NAME,
                r.UPDATE_RULE,
                r.DELETE_RULE
             FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
             INNER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
                ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
                AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
                AND r.TABLE_NAME = k.TABLE_NAME
             WHERE k.CONSTRAINT_SCHEMA = DATABASE()
               AND k.REFERENCED_TABLE_NAME IS NOT NULL'
        );

        if (count($actual) !== count(self::FOREIGN_KEYS)) {
            throw new RuntimeException(
                'The number of foreign keys does not match the expected schema.'
            );
        }

        foreach ($actual as $foreignKey) {
            $expected = self::FOREIGN_KEYS[$foreignKey->CONSTRAINT_NAME]
                ?? null;

            if (!$expected
                || $foreignKey->TABLE_NAME !== $expected['table']
                || $foreignKey->COLUMN_NAME !== $expected['column']
                || $foreignKey->REFERENCED_TABLE_NAME !== $expected['referenced_table']
                || $foreignKey->REFERENCED_COLUMN_NAME !== 'id'
                || $foreignKey->UPDATE_RULE !== 'NO ACTION'
                || $foreignKey->DELETE_RULE !== $expected['delete_rule']) {
                throw new RuntimeException(
                    "Unexpected foreign key: {$foreignKey->CONSTRAINT_NAME}."
                );
            }
        }
    }

    private function assertPreservedIndexesAndConstraints(): void
    {
        $expectedIndexes = [
            'technical_aids_active_reference_unique' => [
                'table' => 'technical_aids',
                'columns' => ['active_reference'],
                'unique' => true,
            ],
            'technical_aids_is_active_category_id_index' => [
                'table' => 'technical_aids',
                'columns' => ['is_active', 'category_id'],
                'unique' => false,
            ],
            'technical_aids_category_id_foreign' => [
                'table' => 'technical_aids',
                'columns' => ['category_id'],
                'unique' => false,
            ],
            'loans_beneficiary_id_loaned_at_index' => [
                'table' => 'loans',
                'columns' => ['beneficiary_id', 'loaned_at'],
                'unique' => false,
            ],
            'loans_manager_id_foreign' => [
                'table' => 'loans',
                'columns' => ['manager_id'],
                'unique' => false,
            ],
            'loan_lines_loan_id_returned_at_index' => [
                'table' => 'loan_lines',
                'columns' => ['loan_id', 'returned_at'],
                'unique' => false,
            ],
            'loan_lines_technical_aid_id_returned_at_index' => [
                'table' => 'loan_lines',
                'columns' => ['technical_aid_id', 'returned_at'],
                'unique' => false,
            ],
            'loan_lines_due_at_returned_at_index' => [
                'table' => 'loan_lines',
                'columns' => ['due_at', 'returned_at'],
                'unique' => false,
            ],
        ];

        foreach ($expectedIndexes as $name => $expected) {
            $rows = DB::select(
                'SELECT COLUMN_NAME, NON_UNIQUE
                 FROM INFORMATION_SCHEMA.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = ?
                   AND INDEX_NAME = ?
                 ORDER BY SEQ_IN_INDEX',
                [$expected['table'], $name]
            );

            $columns = array_map(
                fn ($row) => $row->COLUMN_NAME,
                $rows
            );

            $isUnique = count($rows) > 0
                && (int) $rows[0]->NON_UNIQUE === 0;

            if ($columns !== $expected['columns']
                || $isUnique !== $expected['unique']) {
                throw new RuntimeException(
                    "Required index is missing or different: {$name}."
                );
            }
        }

        $generated = $this->columnInfo(
            'technical_aids',
            'active_reference'
        );

        if (!$generated
            || !str_contains($generated->EXTRA, 'STORED GENERATED')) {
            throw new RuntimeException(
                'The active_reference generated column is missing or invalid.'
            );
        }

        $check = DB::selectOne(
            'SELECT CHECK_CLAUSE
             FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND CONSTRAINT_NAME = ?',
            ['chk_technical_aids_available_units']
        );

        if (!$check) {
            throw new RuntimeException(
                'The inventory CHECK constraint is missing.'
            );
        }

        $normalized = preg_replace(
            '/[`()\s]/',
            '',
            strtolower($check->CHECK_CLAUSE)
        );

        if ($normalized !== 'available_units<=total_units') {
            throw new RuntimeException(
                'The inventory CHECK constraint has an unexpected definition.'
            );
        }
    }

    public function down(): void
    {
        throw new RuntimeException(
            'This UUID v4 conversion cannot be safely reversed automatically.'
        );
    }
};
