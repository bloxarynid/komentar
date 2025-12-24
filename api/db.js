import { neon } from '@neondatabase/serverless';

// Koneksi ke database
export async function getConnection() {
  const sql = neon(process.env.POSTGRES_URL);
  return sql;
}

// Inisialisasi tabel
export async function initDatabase() {
  const sql = await getConnection();
  
  await sql`
    CREATE TABLE IF NOT EXISTS komentar (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      website VARCHAR(255),
      komentar TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved BOOLEAN DEFAULT false
    )
  `;
  
  // Tambahkan data contoh
  const existing = await sql`SELECT COUNT(*) FROM komentar`;
  if (parseInt(existing[0].count) === 0) {
    await sql`
      INSERT INTO komentar (username, email, website, komentar, approved) 
      VALUES 
      ('Admin', 'admin@example.com', 'https://example.com', 'Selamat datang! Komentar pertama.', true),
      ('User Demo', 'user@demo.com', 'https://demo.com', 'Sistem komentar ini keren!', true)
    `;
  }
}
