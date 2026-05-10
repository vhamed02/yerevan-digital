<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = StoreSetting::platform()->pluck('value', 'key');

        return $this->success($settings);
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $settings = $request->validated()['settings'];

        foreach ($settings as $key => $value) {
            StoreSetting::updateOrCreate(
                ['store_id' => null, 'key' => $key],
                ['value' => $value]
            );
        }

        $updated = StoreSetting::platform()->pluck('value', 'key');

        return $this->success($updated, 'Settings updated.');
    }
}
