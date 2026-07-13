<?php

namespace App\Http\Controllers;

use App\Models\Ride;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminStatsController extends Controller
{
    public function show(): JsonResponse
    {
        $lastSevenDays = now()->subDays(7);

        return response()->json([
            'data' => [
                'total_users' => User::query()->count(),
                'new_users_last_7_days' => User::query()
                    ->where('created_at', '>=', $lastSevenDays)
                    ->count(),
                'total_routes_logged' => Ride::query()->count(),
                'routes_logged_last_7_days' => Ride::query()
                    ->where('created_at', '>=', $lastSevenDays)
                    ->count(),
            ],
        ]);
    }
}
