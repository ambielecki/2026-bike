<?php

use App\Http\Controllers\LocationController;
use App\Http\Controllers\RideController;
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

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/locations', [LocationController::class, 'index']);
    Route::post('/locations', [LocationController::class, 'store']);
    Route::get('/rides', [RideController::class, 'index']);
    Route::post('/rides', [RideController::class, 'store']);
    Route::get('/rides/{ride}', [RideController::class, 'show']);
    Route::patch('/rides/{ride}', [RideController::class, 'update']);
    Route::delete('/rides/{ride}', [RideController::class, 'destroy']);
});

if (strcasecmp((string) Config::get('app.env'), 'production') !== 0) {
    Route::prefix('test-errors')->group(function () {
        Route::get('/not-found', [TestHelperController::class, 'notFound']);
        Route::get('/server-error', [TestHelperController::class, 'serverError']);
        Route::get('/validation', [TestHelperController::class, 'validation']);
    });

    Route::middleware('web')->post('/test-session', [TestHelperController::class, 'testSession']);
}
