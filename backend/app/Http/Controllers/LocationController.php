<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLocationRequest;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $locations = Location::query()
            ->whereBelongsTo($request->user())
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $locations,
        ]);
    }

    public function store(StoreLocationRequest $request): JsonResponse
    {
        $location = Location::query()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'data' => $location,
        ], 201);
    }
}
