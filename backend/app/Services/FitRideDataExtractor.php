<?php

namespace App\Services;

use DateTimeInterface;
use Sportlog\FIT\Decoder;
use Sportlog\FIT\Profile\Messages\RecordMessage;
use Sportlog\FIT\Profile\Messages\SessionMessage;
use Sportlog\FIT\Profile\Types\MesgNum;

class FitRideDataExtractor
{
    private const METERS_PER_MILE = 1609.344;

    private const METERS_PER_SECOND_TO_MILES_PER_HOUR = 2.2369362921;

    /**
     * @return array{
     *     datetime: string|null,
     *     route_data: list<array{latitude: float, longitude: float}>,
     *     distance: float|null,
     *     total_time: float|null,
     *     moving_time: float|null,
     *     average_speed: float|null,
     *     max_speed: float|null
     * }
     */
    public function extract(string $path): array
    {
        $messageList = (new Decoder())->read($path);
        $session = $messageList->getMessages(MesgNum::SESSION)[0] ?? null;
        $records = $messageList->getMessages(MesgNum::RECORD);

        return [
            'datetime' => $session instanceof SessionMessage
                ? $this->formatDateTime($session->getStartTime())
                : null,
            'route_data' => $this->routeData($records),
            'distance' => $session instanceof SessionMessage
                ? $this->metersToMiles($this->scalar($session->getTotalDistance()))
                : null,
            'total_time' => $session instanceof SessionMessage
                ? $this->seconds($this->scalar($session->getTotalElapsedTime()))
                : null,
            'moving_time' => $session instanceof SessionMessage
                ? $this->seconds($this->scalar($session->getTotalMovingTime() ?? $session->getTotalTimerTime()))
                : null,
            'average_speed' => $session instanceof SessionMessage
                ? $this->metersPerSecondToMilesPerHour($this->scalar($session->getEnhancedAvgSpeed() ?? $session->getAvgSpeed()))
                : null,
            'max_speed' => $session instanceof SessionMessage
                ? $this->metersPerSecondToMilesPerHour($this->scalar($session->getEnhancedMaxSpeed() ?? $session->getMaxSpeed()))
                : null,
        ];
    }

    /**
     * @param array<int, mixed> $records
     * @return list<array{latitude: float, longitude: float}>
     */
    private function routeData(array $records): array
    {
        $points = [];

        foreach ($records as $record) {
            if (! $record instanceof RecordMessage) {
                continue;
            }

            $latitude = $this->scalar($record->getPositionLat());
            $longitude = $this->scalar($record->getPositionLong());

            if ($latitude === null || $longitude === null) {
                continue;
            }

            $points[] = [
                'latitude' => $this->semicirclesToDegrees($latitude),
                'longitude' => $this->semicirclesToDegrees($longitude),
            ];
        }

        return $points;
    }

    private function scalar(float|int|array|null $value): ?float
    {
        if (is_array($value)) {
            $value = $value[0] ?? null;
        }

        return $value === null ? null : (float) $value;
    }

    private function formatDateTime(?DateTimeInterface $dateTime): ?string
    {
        return $dateTime?->format('Y-m-d H:i:s');
    }

    private function semicirclesToDegrees(float $value): float
    {
        return $value * (180 / 2147483648);
    }

    private function metersToMiles(?float $value): ?float
    {
        return $value === null ? null : round($value / self::METERS_PER_MILE, 2);
    }

    private function metersPerSecondToMilesPerHour(?float $value): ?float
    {
        return $value === null ? null : round($value * self::METERS_PER_SECOND_TO_MILES_PER_HOUR, 2);
    }

    private function seconds(?float $value): ?float
    {
        return $value === null ? null : round($value, 2);
    }
}
