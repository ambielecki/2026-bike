<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TestHelperController extends Controller
{
    public function notFound(): never
    {
        abort(404, 'Test not found error.');
    }

    public function serverError(): never
    {
        abort(500, 'Test server error.');
    }

    /**
     * @throws ValidationException
     */
    public function validation(): never
    {
        throw ValidationException::withMessages([
            'test' => ['Test validation error.'],
        ]);
    }

    public function testSession(Request $request): JsonResponse
    {
        $count = (int) $request->session()->get('test_post_count', 0) + 1;

        $request->session()->put('test_post_count', $count);

        return response()->json([
            'status' => 'ok',
            'count' => $count,
        ]);
    }
}
