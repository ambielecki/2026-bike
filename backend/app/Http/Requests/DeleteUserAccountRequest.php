<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeleteUserAccountRequest extends FormRequest
{
    public const CONFIRMATION_PHRASE = 'Delete My ShowMyRides Account';

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
        return [
            'confirmation_phrase' => ['required', 'string', Rule::in([self::CONFIRMATION_PHRASE])],
        ];
    }
}
