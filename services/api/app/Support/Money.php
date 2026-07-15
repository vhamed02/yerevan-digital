<?php

namespace App\Support;

/**
 * Decimal money arithmetic.
 *
 * Every amount is a decimal string run through bcmath — money never touches a
 * float. Results are rounded half-up to 2 decimal places. `0.05 * 100.10` is
 * exactly 5.005; binary floats round that the wrong way, which is the whole
 * reason this exists.
 */
final class Money
{
    public const SCALE = 2;

    /** Working scale for intermediate products, before rounding back to SCALE. */
    private const CALC_SCALE = 8;

    public const ZERO = '0.00';

    /** Normalise anything numeric (including a decimal cast) to a money string. */
    public static function of(mixed $value): string
    {
        return is_numeric($value) ? self::normalise((string) $value) : self::ZERO;
    }

    public static function add(string $a, string $b): string
    {
        return bcadd($a, $b, self::SCALE);
    }

    public static function sub(string $a, string $b): string
    {
        return bcsub($a, $b, self::SCALE);
    }

    /** Multiply, then round half-up to money scale. */
    public static function mul(string $a, string $b): string
    {
        return self::roundHalfUp(bcmul($a, $b, self::CALC_SCALE));
    }

    public static function div(string $a, string $b): string
    {
        return bcdiv($a, $b, self::CALC_SCALE);
    }

    public static function compare(string $a, string $b): int
    {
        return bccomp($a, $b, self::CALC_SCALE);
    }

    public static function min(string $a, string $b): string
    {
        return self::compare($a, $b) <= 0 ? self::normalise($a) : self::normalise($b);
    }

    public static function max(string $a, string $b): string
    {
        return self::compare($a, $b) >= 0 ? self::normalise($a) : self::normalise($b);
    }

    public static function isNegative(string $value): bool
    {
        return self::compare($value, '0') < 0;
    }

    /** Clamp a negative amount to zero. */
    public static function atLeastZero(string $value): string
    {
        return self::isNegative($value) ? self::ZERO : self::normalise($value);
    }

    public static function negate(string $value): string
    {
        return bcsub('0', $value, self::SCALE);
    }

    public static function roundHalfUp(string $value): string
    {
        $offset = self::isNegative($value) ? '-0.005' : '0.005';

        // bcadd truncates at the target scale, so offsetting by a half-unit first
        // turns that truncation into a half-up round (away from zero).
        return bcadd($value, $offset, self::SCALE);
    }

    private static function normalise(string $value): string
    {
        return bcadd($value, '0', self::SCALE);
    }
}
