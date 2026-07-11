<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAdminImageRequest;
use App\Models\Image;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

class AdminImageController extends Controller
{
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
            'data' => [
                'id' => $image->id,
                'description' => $image->description,
                'alt_text' => $image->alt_text ?: ($image->description ?? 'Homepage image'),
                'urls' => $image->refresh()->urls(),
            ],
        ], 201);
    }
}
