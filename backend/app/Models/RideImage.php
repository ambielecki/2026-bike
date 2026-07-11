<?php

namespace App\Models;

use Database\Factories\RideImageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['ride_id', 'name', 'description', 'has_sizes'])]
class RideImage extends Model
{
    /** @use HasFactory<RideImageFactory> */
    use HasFactory;

    protected $table = 'images';

    /**
     * @return BelongsTo<Ride, $this>
     */
    public function ride(): BelongsTo
    {
        return $this->belongsTo(Ride::class);
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
