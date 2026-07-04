<?php

namespace App\Models;

use Database\Factories\RideFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'description',
    'user_id',
    'location_id',
    'datetime',
    'route_data',
    'distance',
    'total_time',
    'moving_time',
    'average_speed',
    'max_speed',
])]
class Ride extends Model
{
    /** @use HasFactory<RideFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * @return HasMany<RideImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(RideImage::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'datetime' => 'datetime',
            'route_data' => 'array',
            'distance' => 'decimal:2',
            'total_time' => 'decimal:2',
            'moving_time' => 'decimal:2',
            'average_speed' => 'decimal:2',
            'max_speed' => 'decimal:2',
        ];
    }
}
