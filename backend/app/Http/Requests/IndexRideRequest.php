<?php

namespace App\Http\Requests;

use App\Models\Location;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexRideRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'date_range' => ['nullable', 'string', Rule::in(['last_week', 'last_month', 'last_year'])],
            'end_date' => ['nullable', 'date', Rule::when($this->filled('start_date'), 'after_or_equal:start_date')],
            'location_id' => [
                'nullable',
                'integer',
                Rule::exists('locations', 'id')->where(function ($query) use ($userId): void {
                    $query->where(function ($query) use ($userId): void {
                        $query
                            ->where('user_id', $userId)
                            ->orWhere('system_key', Location::SYSTEM_KEY_WATOPIA);
                    });
                }),
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50])],
            'start_date' => ['nullable', 'date'],
        ];
    }
}
