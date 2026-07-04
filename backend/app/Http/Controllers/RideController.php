<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRideRequest;
use App\Models\Ride;
use App\Models\RideImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RideController extends Controller
{
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
}
