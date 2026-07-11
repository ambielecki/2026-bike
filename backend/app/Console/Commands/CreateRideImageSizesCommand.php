<?php

namespace App\Console\Commands;

use App\Models\RideImage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CreateRideImageSizesCommand extends Command
{
    private const SIZES = [
        'small' => 320,
        'medium' => 960,
        'large' => 1600,
    ];

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ride:create-image-sizes {image}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create small, medium, and large sizes for an image record.';

    public function handle(): int
    {
        $image = RideImage::query()->findOrFail($this->argument('image'));
        $originalPath = $this->path($image, 'original');
        $source = Storage::disk('public')->path($originalPath);

        foreach (self::SIZES as $size => $maxWidth) {
            $this->writeSize($source, $this->path($image, $size), $maxWidth);
        }

        $image->forceFill([
            'has_sizes' => true,
        ])->save();

        $this->info("Created image sizes for image {$image->id}.");

        return self::SUCCESS;
    }

    private function path(RideImage $image, string $size): string
    {
        return "rides/{$image->ride_id}/images/{$size}/{$image->name}";
    }

    private function writeSize(string $source, string $targetPath, int $maxWidth): void
    {
        $target = Storage::disk('public')->path($targetPath);
        $directory = dirname($target);

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $imageSize = getimagesize($source);

        if ($imageSize === false || ! function_exists('imagecreatetruecolor')) {
            copy($source, $target);

            return;
        }

        [$width, $height, $type] = $imageSize;
        $ratio = min(1, $maxWidth / $width);
        $targetWidth = max(1, (int) round($width * $ratio));
        $targetHeight = max(1, (int) round($height * $ratio));

        $sourceImage = $this->createImageResource($source, $type);

        if ($sourceImage === null || $sourceImage === false) {
            copy($source, $target);

            return;
        }

        $targetImage = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($targetImage, false);
        imagesavealpha($targetImage, true);
        imagecopyresampled(
            $targetImage,
            $sourceImage,
            0,
            0,
            0,
            0,
            $targetWidth,
            $targetHeight,
            $width,
            $height,
        );

        $this->saveImageResource($targetImage, $target, $type);

        imagedestroy($sourceImage);
        imagedestroy($targetImage);
    }

    /**
     * @return \GdImage|false|null
     */
    private function createImageResource(string $source, int $type)
    {
        return match ($type) {
            IMAGETYPE_GIF => function_exists('imagecreatefromgif') ? imagecreatefromgif($source) : null,
            IMAGETYPE_JPEG => function_exists('imagecreatefromjpeg') ? imagecreatefromjpeg($source) : null,
            IMAGETYPE_PNG => function_exists('imagecreatefrompng') ? imagecreatefrompng($source) : null,
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($source) : null,
            default => null,
        };
    }

    /**
     * @param  \GdImage  $image
     */
    private function saveImageResource($image, string $target, int $type): void
    {
        match ($type) {
            IMAGETYPE_GIF => imagegif($image, $target),
            IMAGETYPE_JPEG => imagejpeg($image, $target, 85),
            IMAGETYPE_PNG => imagepng($image, $target),
            IMAGETYPE_WEBP => imagewebp($image, $target, 85),
            default => imagejpeg($image, $target, 85),
        };
    }
}
