<?php

use App\Http\Controllers\TestHelperController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Route;

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
        Route::get('/not-found', [TestHelperController::class, 'notFound']);
        Route::get('/server-error', [TestHelperController::class, 'serverError']);
        Route::get('/validation', [TestHelperController::class, 'validation']);
    });

    Route::middleware('web')->post('/test-session', [TestHelperController::class, 'testSession']);
}
