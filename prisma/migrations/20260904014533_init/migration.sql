-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'KASIR') NOT NULL DEFAULT 'KASIR',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    INDEX `categories_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `barcode` VARCHAR(64) NULL,
    `category_id` INTEGER NOT NULL,
    `purchase_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `selling_price` DECIMAL(12, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `minimum_stock` INTEGER NOT NULL DEFAULT 5,
    `image_url` VARCHAR(500) NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `outlet_id` INTEGER NULL,

    UNIQUE INDEX `products_barcode_key`(`barcode`),
    INDEX `products_name_idx`(`name`),
    INDEX `products_category_id_idx`(`category_id`),
    INDEX `products_status_idx`(`status`),
    INDEX `products_deleted_at_idx`(`deleted_at`),
    INDEX `products_stock_minimum_stock_idx`(`stock`, `minimum_stock`),
    INDEX `products_barcode_idx`(`barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_methods_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_number` VARCHAR(30) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `payment_method_id` INTEGER NOT NULL,
    `total` DECIMAL(14, 2) NOT NULL,
    `amount_paid` DECIMAL(14, 2) NOT NULL,
    `change_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `status` ENUM('COMPLETED', 'VOID') NOT NULL DEFAULT 'COMPLETED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `outlet_id` INTEGER NULL,

    UNIQUE INDEX `transactions_invoice_number_key`(`invoice_number`),
    INDEX `transactions_user_id_idx`(`user_id`),
    INDEX `transactions_created_at_idx`(`created_at`),
    INDEX `transactions_payment_method_id_idx`(`payment_method_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `product_name_snapshot` VARCHAR(150) NOT NULL,
    `price_snapshot` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `subtotal` DECIMAL(14, 2) NOT NULL,

    INDEX `transaction_details_transaction_id_idx`(`transaction_id`),
    INDEX `transaction_details_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `type` ENUM('IN', 'OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `stock_before` INTEGER NOT NULL,
    `stock_after` INTEGER NOT NULL,
    `reference_type` ENUM('TRANSACTION', 'MANUAL', 'INITIAL') NOT NULL,
    `reference_id` INTEGER NULL,
    `note` VARCHAR(255) NULL,
    `user_id` INTEGER NOT NULL,
    `transaction_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_product_id_idx`(`product_id`),
    INDEX `stock_movements_created_at_idx`(`created_at`),
    INDEX `stock_movements_reference_type_reference_id_idx`(`reference_type`, `reference_id`),
    INDEX `stock_movements_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_payment_method_id_fkey` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_details` ADD CONSTRAINT `transaction_details_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_details` ADD CONSTRAINT `transaction_details_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
