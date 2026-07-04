<?php

namespace App\Http\Requests;

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
                Rule::exists('locations', 'id')->where('user_id', $userId),
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
