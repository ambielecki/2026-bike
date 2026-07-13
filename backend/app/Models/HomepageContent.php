<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['highlights'])]
class HomepageContent extends Model
{
    use HasFactory;

    /**
     * @return BelongsToMany<Image, $this>
     */
    public function carouselImages(): BelongsToMany
    {
        return $this->belongsToMany(Image::class, 'homepage_carousel_images')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderBy('homepage_carousel_images.sort_order');
    }

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'highlights' => [
                [
                    'title' => 'Save routes that matter',
                    'copy' => 'Keep your favorite climbs, descents, and loops in one place instead of digging through old ride files.',
                    'sort_order' => 0,
                ],
                [
                    'title' => 'Add context to each ride',
                    'copy' => 'Capture conditions, difficulty, and trail notes so the next outing starts with better information.',
                    'sort_order' => 1,
                ],
                [
                    'title' => 'Build your own trail map',
                    'copy' => 'Turn repeated rides into a personal map of where you have been and where you want to ride next.',
                    'sort_order' => 2,
                ],
            ],
        ];
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'highlights' => 'array',
        ];
    }
}
