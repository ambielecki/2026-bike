<?php

namespace App\Http\Requests;

use App\Models\Location;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRideRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'location_id' => [
                'required',
                'integer',
                Rule::exists('locations', 'id')->where(function ($query) use ($userId): void {
                    $query->where(function ($query) use ($userId): void {
                        $query
                            ->where('user_id', $userId)
                            ->orWhere('system_key', Location::SYSTEM_KEY_WATOPIA);
                    });
                }),
            ],
            'fit_file' => [
                'required',
                'file',
                'extensions:fit',
                'max:25600',
            ],
            'image' => [
                'nullable',
                'image',
                'max:10240',
            ],
        ];
    }
}
