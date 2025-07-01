import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';

// POST /api/admin/links/add
export async function POST(req: NextRequest) {
  try {
    const { offer_id, publisher_ids, name } = await req.json();
    if (!offer_id) {
      return NextResponse.json({ error: 'Offer is required.' }, { status: 400 });
    }

    let publisherIdsToInsert: string[] = [];
    if (!publisher_ids || publisher_ids.length === 0) {
      // If no publishers selected, select all approved publishers
      const result = await pool.query('SELECT id FROM publishers WHERE status = $1', ['approved']);
      publisherIdsToInsert = result.rows.map((row: { id: string | number }) => String(row.id));
    } else {
      publisherIdsToInsert = publisher_ids;
    }

    // Insert links for each publisher (generate uuid for id)
    const values: unknown[] = [];
    const placeholders: string[] = [];
    publisherIdsToInsert.forEach((pubId, idx) => {
      const linkId = randomUUID();
      values.push(linkId, offer_id, pubId, name || null);
      placeholders.push(`($${idx * 4 + 1}::uuid, $${idx * 4 + 2}, $${idx * 4 + 3}::uuid, $${idx * 4 + 4})`);
    });
    if (values.length === 0) {
      return NextResponse.json({ error: 'No publishers found.' }, { status: 400 });
    }
    await pool.query(
      `INSERT INTO links (id, offer_id, publisher_id, name) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`,
      values
    );
    return NextResponse.json({ message: 'Links added successfully.' });
  } catch (err) {
    console.error('Error adding links:', err);
    return NextResponse.json({ error: 'Failed to add links.' }, { status: 500 });
  }
}
