ALTER DATABASE `vendora` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON `vendora`.* TO 'vendora'@'%';
FLUSH PRIVILEGES;
