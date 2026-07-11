<?php

namespace App\Models;

use Database\Factories\ImageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

#[Fillable(['name', 'description', 'alt_text', 'has_sizes'])]
class Image extends Model
{
    /** @use HasFactory<ImageFactory> */
    use HasFactory;

    protected $table = 'images';

    /**
     * @return array<string, string>
     */
    public function urls(): array
    {
        $displayPath = $this->has_sizes ? null : $this->path('original');

        return [
            'small' => Storage::disk('public')->url($displayPath ?? $this->path('small')),
            'medium' => Storage::disk('public')->url($displayPath ?? $this->path('medium')),
            'large' => Storage::disk('public')->url($displayPath ?? $this->path('large')),
            'original' => Storage::disk('public')->url($this->path('original')),
        ];
    }

    public function path(string $size): string
    {
        return "homepage/images/{$size}/{$this->name}";
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'has_sizes' => 'boolean',
        ];
    }
}
