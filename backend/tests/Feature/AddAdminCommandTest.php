<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_an_admin_user(): void
    {
        $this->artisan('user:add-admin')
            ->expectsQuestion('Name', 'Ada Admin')
            ->expectsQuestion('Email address', 'ada@example.com')
            ->expectsQuestion('Password', 'password')
            ->expectsQuestion('Confirm password', 'password')
            ->expectsOutput('Admin user created.')
            ->assertSuccessful();

        $user = User::where('email', 'ada@example.com')->firstOrFail();

        $this->assertSame('Ada Admin', $user->name);
        $this->assertTrue($user->is_admin);
        $this->assertIsBool($user->is_admin);
        $this->assertNotSame('password', $user->password);
    }

    public function test_it_applies_registration_validation_rules(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $this->artisan('user:add-admin')
            ->expectsQuestion('Name', '')
            ->expectsQuestion('Email address', 'existing@example.com')
            ->expectsQuestion('Password', 'short')
            ->expectsQuestion('Confirm password', 'different')
            ->expectsOutput('The name field is required.')
            ->expectsOutput('The email has already been taken.')
            ->expectsOutput('The password field confirmation does not match.')
            ->assertFailed();

        $this->assertSame(1, User::count());
    }
}
