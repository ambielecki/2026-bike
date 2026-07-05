<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexRideRequest;
use App\Http\Requests\StoreRideRequest;
use App\Models\Ride;
use App\Models\RideImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RideController extends Controller
{
    public function index(IndexRideRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 10);

        $query = Ride::query()
            ->with([
                'location:id,name',
                'images' => fn ($query) => $query->oldest('id'),
            ])
            ->whereBelongsTo($request->user())
            ->when($validated['location_id'] ?? null, fn ($query, $locationId) => $query->where('location_id', $locationId))
            ->when($validated['date_range'] ?? null, function ($query, string $dateRange) {
                $query->where('datetime', '>=', match ($dateRange) {
                    'last_week' => now()->subWeek(),
                    'last_month' => now()->subMonth(),
                    'last_year' => now()->subYear(),
                });
            })
            ->orderByRaw('datetime IS NULL')
            ->orderByDesc('datetime')
            ->orderByDesc('created_at');

        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => $paginator->getCollection()->map(fn (Ride $ride): array => [
                'id' => $ride->id,
                'name' => $ride->name,
                'datetime' => $ride->datetime?->toISOString(),
                'distance' => $ride->distance,
                'total_time' => $ride->total_time,
                'location' => $ride->location ? [
                    'id' => $ride->location->id,
                    'name' => $ride->location->name,
                ] : null,
                'thumbnail_url' => $this->thumbnailUrl($ride),
            ])->values(),
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

    public function store(StoreRideRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $ride = DB::transaction(function () use ($request, $user, $validated): Ride {
            $ride = Ride::query()->create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'location_id' => $validated['location_id'],
                'user_id' => $user->id,
            ]);

            $fitPath = $request->file('fit_file')->storeAs(
                "ride-fit/{$ride->id}",
                Str::uuid()->toString().'.fit',
            );

            Artisan::call('ride:process-fit', [
                'ride' => $ride->id,
                'fitPath' => $fitPath,
            ]);

            if ($request->hasFile('image')) {
                $extension = $request->file('image')->extension();
                $imageName = Str::uuid()->toString().'.'.$extension;

                $request->file('image')->storeAs(
                    "rides/{$ride->id}/images/original",
                    $imageName,
                    'public',
                );

                $image = RideImage::query()->create([
                    'ride_id' => $ride->id,
                    'user_id' => $user->id,
                    'name' => $imageName,
                    'description' => null,
                    'has_sizes' => false,
                ]);

                Artisan::call('ride:create-image-sizes', [
                    'image' => $image->id,
                ]);
            }

            return $ride->load('location', 'images');
        });

        return response()->json([
            'data' => $ride,
        ], 201);
    }

    public function show(Ride $ride): JsonResponse
    {
        abort_unless($ride->user_id === request()->user()?->id, 404);

        $ride->load([
            'location:id,name,latitude,longitude',
            'images' => fn ($query) => $query->oldest('id'),
        ]);

        return response()->json([
            'data' => [
                'id' => $ride->id,
                'name' => $ride->name,
                'description' => $ride->description,
                'datetime' => $ride->datetime?->toISOString(),
                'distance' => $ride->distance,
                'total_time' => $ride->total_time,
                'moving_time' => $ride->moving_time,
                'average_speed' => $ride->average_speed,
                'max_speed' => $ride->max_speed,
                'route_data' => $ride->route_data ?? [],
                'location' => $ride->location ? [
                    'id' => $ride->location->id,
                    'name' => $ride->location->name,
                    'latitude' => $ride->location->latitude,
                    'longitude' => $ride->location->longitude,
                ] : null,
            ],
        ]);
    }

    private function thumbnailUrl(Ride $ride): ?string
    {
        $image = $ride->images->first();

        if (! $image instanceof RideImage) {
            return null;
        }

        $size = $image->has_sizes ? 'small' : 'original';

        return Storage::disk('public')->url("rides/{$ride->id}/images/{$size}/{$image->name}");
    }
}
