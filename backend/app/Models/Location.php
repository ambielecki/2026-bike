<?php

namespace App\Models;

use Database\Factories\LocationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'user_id', 'system_key', 'map_provider', 'latitude', 'longitude'])]
class Location extends Model
{
    /** @use HasFactory<LocationFactory> */
    use HasFactory;

    public const MAP_PROVIDER_OPENSTREETMAP = 'openstreetmap';

    public const MAP_PROVIDER_WATOPIA = 'watopia';

    public const SYSTEM_KEY_WATOPIA = 'watopia';

    /**
     * @return array<string, mixed>
     */
    public static function watopiaAttributes(): array
    {
        return [
            'name' => 'Watopia',
            'user_id' => null,
            'system_key' => self::SYSTEM_KEY_WATOPIA,
            'map_provider' => self::MAP_PROVIDER_WATOPIA,
            'latitude' => -11.683420,
            'longitude' => 166.955010,
        ];
    }

    /**
     * @param  Builder<Location>  $query
     * @return Builder<Location>
     */
    public function scopeVisibleToUser(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $query) use ($user): void {
            $query
                ->where('user_id', $user->id)
                ->orWhere('system_key', self::SYSTEM_KEY_WATOPIA);
        });
    }

    /**
     * @param  Builder<Location>  $query
     * @return Builder<Location>
     */
    public function scopeEditableByUser(Builder $query, User $user): Builder
    {
        return $query->where('user_id', $user->id)->whereNull('system_key');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Ride, $this>
     */
    public function rides(): HasMany
    {
        return $this->hasMany(Ride::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:6',
            'longitude' => 'decimal:6',
        ];
    }
}
