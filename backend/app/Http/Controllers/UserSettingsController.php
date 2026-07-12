<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteUserAccountRequest;
use App\Http\Requests\UpdateUserNameRequest;
use App\Http\Requests\UpdateUserPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

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

    public function destroy(DeleteUserAccountRequest $request): Response
    {
        $user = $request->user();
        $rideIds = $user->rides()->pluck('id');

        foreach ($rideIds as $rideId) {
            Storage::deleteDirectory("ride-fit/{$rideId}");
            Storage::disk('public')->deleteDirectory("rides/{$rideId}");
        }

        Auth::guard('web')->logout();

        $user->delete();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->noContent();
    }
}
