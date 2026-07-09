<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserNameRequest;
use App\Http\Requests\UpdateUserPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;

class UserSettingsController extends Controller
{
    public function updateName(UpdateUserNameRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->forceFill([
            'name' => $validated['name'],
        ])->save();

        return response()->json($user->fresh());
    }

    public function updatePassword(UpdateUserPasswordRequest $request): Response
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        return response()->noContent();
    }
}
