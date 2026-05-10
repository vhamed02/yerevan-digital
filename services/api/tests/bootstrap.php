<?php

$storageBase = dirname(__DIR__) . '/storage';

$testEnv = [
    'APP_ENV'             => 'testing',
    'DB_CONNECTION'       => 'sqlite',
    'DB_DATABASE'         => ':memory:',
    'DB_URL'              => '',
    'MAIL_MAILER'         => 'array',
    'QUEUE_CONNECTION'    => 'sync',
    'CACHE_STORE'         => 'array',
    'SESSION_DRIVER'      => 'array',
    'BCRYPT_ROUNDS'       => '4',
    'REDIS_CLIENT'        => 'predis',
    'VIEW_COMPILED_PATH'  => $storageBase . '/framework/views',
];

foreach ($testEnv as $key => $value) {
    putenv("{$key}={$value}");
    $_ENV[$key]    = $value;
    $_SERVER[$key] = $value;
}

require __DIR__ . '/../vendor/autoload.php';
