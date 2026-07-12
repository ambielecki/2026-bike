<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateHomepageContentRequest;
use App\Models\HomepageContent;
use App\Models\Image;
use Illuminate\Http\JsonResponse;

class HomepageController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'data' => $this->homepageData($this->content()),
        ]);
    }

    public function adminShow(): JsonResponse
    {
        return response()->json([
            'data' => [
                ...$this->homepageData($this->content()),
                'available_images' => Image::query()
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(fn (Image $image): array => $image->apiData())
                    ->values(),
            ],
        ]);
    }

    public function update(UpdateHomepageContentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $content = $this->content();

        $content->update([
            'site_name' => $validated['site_name'],
            'headline' => $validated['headline'],
            'intro' => $validated['intro'],
            'highlights' => collect($validated['highlights'])
                ->values()
                ->map(fn (array $highlight, int $index): array => [
                    'title' => $highlight['title'],
                    'copy' => $highlight['copy'],
                    'sort_order' => $index,
                ])
                ->all(),
        ]);

        $syncData = collect($validated['carousel_image_ids'])
            ->values()
            ->mapWithKeys(fn (int $imageId, int $index): array => [
                $imageId => ['sort_order' => $index],
            ])
            ->all();

        $content->carouselImages()->sync($syncData);

        return response()->json([
            'data' => $this->homepageData($content->refresh()),
        ]);
    }

    private function content(): HomepageContent
    {
        return HomepageContent::query()->first()
            ?? HomepageContent::query()->create(HomepageContent::defaults());
    }

    /**
     * @return array<string, mixed>
     */
    private function homepageData(HomepageContent $content): array
    {
        $content->load('carouselImages');

        return [
            'id' => $content->id,
            'site_name' => $content->site_name,
            'headline' => $content->headline,
            'intro' => $content->intro,
            'highlights' => collect($content->highlights ?? [])
                ->sortBy('sort_order')
                ->values()
                ->all(),
            'carousel_images' => $content->carouselImages
                ->map(fn (Image $image): array => $image->apiData())
                ->values(),
        ];
    }
}
