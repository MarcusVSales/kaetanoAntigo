
const { pool } = require('./mysql');

async function ensureMySqlSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category VARCHAR(255) NOT NULL,
      price DECIMAL(12,2),
      quantity INT DEFAULT 1,
      sold TINYINT DEFAULT 0,
      visible TINYINT DEFAULT 1,
      featured TINYINT DEFAULT 0,
      decade VARCHAR(100),
      sold_date VARCHAR(50),
      sold_price DECIMAL(12,2),
      buyer_name TEXT,
      buyer_doc TEXT,
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_products_list
        (visible, sold, featured, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(36) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      is_primary TINYINT DEFAULT 0,
      order_index INT DEFAULT 0,
      crop_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_images_product (product_id, is_primary),
      CONSTRAINT fk_images_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(191) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email VARCHAR(255),
      failed_attempts INT DEFAULT 0,
      locked_until VARCHAR(50),
      token_version INT DEFAULT 1,
      reset_token_hash TEXT,
      reset_expires VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS page_views (
      id VARCHAR(36) PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      path TEXT NOT NULL,
      referrer TEXT,
      device VARCHAR(100),
      duration_sec INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pv_created (created_at),
      INDEX idx_pv_session (session_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`CREATE TABLE IF NOT EXISTS image_files (
    filename VARCHAR(255) PRIMARY KEY,
    content_type VARCHAR(32) NOT NULL,
    content LONGBLOB NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('[MySQL] Estrutura das tabelas preparada.');
}

module.exports = { ensureMySqlSchema };
