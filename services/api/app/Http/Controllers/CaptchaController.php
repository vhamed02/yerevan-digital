<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class CaptchaController extends Controller
{
    public function generate(): JsonResponse
    {
        $a = random_int(1, 9);
        $b = random_int(1, 9);

        $token = $this->sign($a + $b);
        $image = $this->render($a, $b);

        return response()->json(['token' => $token, 'image' => $image]);
    }

    public static function verify(string $token, string $answer): bool
    {
        $parts = explode('.', $token, 2);
        if (count($parts) !== 2) return false;

        [$payload, $sig] = $parts;
        $expected = substr(hash_hmac('sha256', $payload, config('app.key')), 0, 40);
        if (!hash_equals($expected, $sig)) return false;

        $data = json_decode(base64_decode($payload), true);
        if (!$data || ($data['e'] ?? 0) < time()) return false;

        return (int) $answer === ($data['a'] ?? -1);
    }

    private function sign(int $answer): string
    {
        $payload = base64_encode(json_encode(['a' => $answer, 'e' => time() + 600]));
        $sig = substr(hash_hmac('sha256', $payload, config('app.key')), 0, 40);
        return $payload . '.' . $sig;
    }

    private function render(int $a, int $b): string
    {
        $w = 180; $h = 56;
        $img = imagecreatetruecolor($w, $h);

        $bg   = imagecolorallocate($img, 249, 250, 251); // gray-50
        $fg   = imagecolorallocate($img, 17,  24,  39);  // gray-900
        $noise = imagecolorallocate($img, 203, 213, 225); // slate-300

        imagefill($img, 0, 0, $bg);

        // subtle border
        imagerectangle($img, 0, 0, $w - 1, $h - 1, $noise);

        // noise dots
        for ($i = 0; $i < 80; $i++) {
            imagesetpixel($img, random_int(2, $w - 3), random_int(2, $h - 3), $noise);
        }

        // noise lines
        for ($i = 0; $i < 3; $i++) {
            imageline($img, random_int(0, $w), random_int(0, $h), random_int(0, $w), random_int(0, $h), $noise);
        }

        $text = "{$a} + {$b} = ?";
        $font = 5; // built-in font, 9×15px per char
        $tw   = strlen($text) * imagefontwidth($font);
        $th   = imagefontheight($font);
        imagestring($img, $font, (int)(($w - $tw) / 2), (int)(($h - $th) / 2), $text, $fg);

        ob_start();
        imagepng($img);
        $data = ob_get_clean();
        imagedestroy($img);

        return 'data:image/png;base64,' . base64_encode($data);
    }
}
