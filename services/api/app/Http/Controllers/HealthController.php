<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        $services = [
            'database' => $this->checkDatabase(),
            'redis'    => $this->checkRedis(),
            'storage'  => $this->checkStorage(),
            'queue'    => $this->checkQueue(),
        ];

        $status = in_array('error', $services) ? 'degraded' : 'ok';

        return $this->success([
            'status'    => $status,
            'version'   => config('app.version', '1.0.0'),
            'timestamp' => now()->toIso8601String(),
            'services'  => $services,
        ]);
    }

    private function checkDatabase(): string
    {
        try {
            DB::selectOne('SELECT 1');
            return 'ok';
        } catch (\Throwable) {
            return 'error';
        }
    }

    private function checkRedis(): string
    {
        try {
            Redis::ping();
            return 'ok';
        } catch (\Throwable) {
            return 'error';
        }
    }

    private function checkStorage(): string
    {
        try {
            $key = '.health-check';
            Storage::disk('local')->put($key, '1');
            Storage::disk('local')->delete($key);
            return 'ok';
        } catch (\Throwable) {
            return 'error';
        }
    }

    private function checkQueue(): string
    {
        try {
            Queue::size();
            return 'ok';
        } catch (\Throwable) {
            return 'error';
        }
    }
}
