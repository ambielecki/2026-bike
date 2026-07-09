<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexLocationRequest;
use App\Http\Requests\StoreLocationRequest;
use App\Http\Requests\UpdateLocationRequest;
use App\Models\Location;
use Illuminate\Http\JsonResponse;

class LocationController extends Controller
{
    public function index(IndexLocationRequest $request): JsonResponse
    {
        $query = Location::query()
            ->when(
                $request->hasAny(['page', 'per_page']),
                fn ($query) => $query->editableByUser($request->user()),
                fn ($query) => $query->visibleToUser($request->user()),
            )
            ->orderBy('name');

        if ($request->hasAny(['page', 'per_page'])) {
            $validated = $request->validated();
            $paginator = $query->paginate((int) ($validated['per_page'] ?? 10));

            return response()->json([
                'data' => $paginator->getCollection()->values(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'from' => $paginator->firstItem(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'to' => $paginator->lastItem(),
                    'total' => $paginator->total(),
                ],
            ]);
        }

        return response()->json([
            'data' => $query->get(),
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

    public function update(UpdateLocationRequest $request, Location $location): JsonResponse
    {
        abort_unless($location->user_id === $request->user()?->id, 404);

        $location->update($request->validated());

        return response()->json([
            'data' => $location->fresh(),
        ]);
    }
}
