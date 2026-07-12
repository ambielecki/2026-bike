<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAdminImageRequest;
use App\Http\Requests\UpdateAdminImageRequest;
use App\Models\Image;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminImageController extends Controller
{
    private const IMAGE_SIZES = [
        'original',
        'small',
        'medium',
        'large',
    ];

    public function store(StoreAdminImageRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $file = $request->file('image');
        $name = Str::uuid()->toString().'.'.$file->extension();

        $file->storeAs('homepage/images/original', $name, 'public');

        $image = Image::query()->create([
            'name' => $name,
            'description' => $validated['description'] ?? null,
            'alt_text' => $validated['alt_text'],
            'has_sizes' => false,
        ]);

        Artisan::call('image:create-sizes', [
            'image' => $image->id,
        ]);

        return response()->json([
            'data' => $image->refresh()->apiData(),
        ], 201);
    }

    public function update(UpdateAdminImageRequest $request, Image $image): JsonResponse
    {
        $validated = $request->validated();

        $image->update([
            'description' => $validated['description'] ?? null,
            'alt_text' => $validated['alt_text'],
        ]);

        return response()->json([
            'data' => $image->refresh()->apiData(),
        ]);
    }

    public function destroy(Image $image): JsonResponse
    {
        $paths = collect(self::IMAGE_SIZES)
            ->map(fn (string $size): string => $image->path($size))
            ->all();

        $image->delete();
        Storage::disk('public')->delete($paths);

        return response()->json(null, 204);
    }
}
