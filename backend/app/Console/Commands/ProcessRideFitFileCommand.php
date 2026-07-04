<?php

namespace App\Console\Commands;

use App\Models\Ride;
use App\Services\FitRideDataExtractor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ProcessRideFitFileCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ride:process-fit {ride} {fitPath}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process an uploaded ride FIT file and update the ride metrics.';

    public function handle(FitRideDataExtractor $extractor): int
    {
        $ride = Ride::query()->findOrFail($this->argument('ride'));
        $fitPath = (string) $this->argument('fitPath');

        $ride->forceFill($extractor->extract(Storage::path($fitPath)))->save();
        Storage::delete($fitPath);

        $this->info("Processed FIT file for ride {$ride->id}.");

        return self::SUCCESS;
    }
}
