import { getConnection, initDatabase } from './db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();
    const sql = await getConnection();

    // GET: Ambil semua komentar
    if (req.method === 'GET') {
      const komentar = await sql`
        SELECT * FROM komentar 
        WHERE approved = true 
        ORDER BY created_at DESC
        LIMIT 100
      `;
      return res.status(200).json({ success: true, data: komentar });
    }

    // POST: Tambah komentar baru
    if (req.method === 'POST') {
      const { username, email, website, komentar } = req.body;
      
      if (!username || !email || !komentar) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, email, dan komentar wajib diisi' 
        });
      }

      // Validasi email sederhana
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Format email tidak valid' 
        });
      }

      const result = await sql`
        INSERT INTO komentar (username, email, website, komentar, approved)
        VALUES (${username}, ${email}, ${website || null}, ${komentar}, false)
        RETURNING *
      `;

      return res.status(201).json({ 
        success: true, 
        message: 'Komentar berhasil dikirim! Menunggu persetujuan admin.',
        data: result[0]
      });
    }

    // PUT: Update komentar (admin only - tambahkan auth jika perlu)
    if (req.method === 'PUT') {
      const { id, action } = req.body;
      
      if (action === 'approve') {
        await sql`UPDATE komentar SET approved = true WHERE id = ${id}`;
        return res.json({ success: true, message: 'Komentar disetujui' });
      }
    }

    // DELETE: Hapus komentar (admin only)
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await sql`DELETE FROM komentar WHERE id = ${id}`;
      return res.json({ success: true, message: 'Komentar dihapus' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
}
