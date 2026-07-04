<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
    ]);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

if (strcasecmp((string) Config::get('app.env'), 'production') !== 0) {
    Route::prefix('test-errors')->group(function () {
        Route::get('/not-found', function () {
            abort(404, 'Test not found error.');
        });

        Route::get('/server-error', function () {
            abort(500, 'Test server error.');
        });

        Route::get('/validation', function () {
            throw ValidationException::withMessages([
                'test' => ['Test validation error.'],
            ]);
        });
    });

    Route::middleware('web')->post('/test-session', function (Request $request) {
        $count = (int) $request->session()->get('test_post_count', 0) + 1;

        $request->session()->put('test_post_count', $count);

        return response()->json([
            'status' => 'ok',
            'count' => $count,
        ]);
    });
}
