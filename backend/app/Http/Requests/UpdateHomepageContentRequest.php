<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHomepageContentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->is_admin === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'highlights' => ['required', 'array', 'min:1'],
            'highlights.*.title' => ['required', 'string', 'max:255'],
            'highlights.*.copy' => ['required', 'string'],
            'carousel_image_ids' => ['present', 'array'],
            'carousel_image_ids.*' => ['integer', 'distinct', 'exists:images,id'],
        ];
    }
}
