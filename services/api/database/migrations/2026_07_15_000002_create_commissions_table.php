<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->foreignId('store_id')->constrained()->restrictOnDelete();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->enum('type', ['accrual', 'reversal']);

            // Rate and base are snapshotted per row so historical commissions stay
            // auditable after a store's rate changes.
            $table->decimal('rate', 5, 4);
            $table->decimal('base_amount', 15, 2);

            // Signed: positive on accrual, negative on reversal. Store balance is SUM(amount).
            $table->decimal('amount', 15, 2);

            $table->string('currency', 10)->default('AMD');
            $table->string('reason')->nullable();
            $table->timestamps();

            // One accrual and at most one reversal per order — the idempotency guard.
            $table->unique(['order_id', 'type']);
            $table->index(['store_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
