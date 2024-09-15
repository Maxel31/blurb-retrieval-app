import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export default async function handler(req, res) {
  const dbPath = path.resolve(process.cwd(), 'data/catch_phrases_v2.db'); // dataフォルダ内のDBを使用
  console.log('Database path:', dbPath);  // パスを確認

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // PRAGMA設定を追加
    await db.exec('PRAGMA cache_size = -20000'); // キャッシュサイズを増やす（単位はページ数、負の値はKB単位）
    await db.exec('PRAGMA synchronous = NORMAL'); // データ書き込みの同期を緩和してパフォーマンスを向上
    await db.exec('PRAGMA journal_mode = WAL'); // Write-Ahead Loggingを有効にして並行処理を改善

    if (req.method === 'POST') {
      const { query, values, limit, offset = 0 } = req.body;
    
      try {
        let paginatedQuery;
        let queryValues;

        // ページネーションが必要な場合
        if (limit) {
          paginatedQuery = `${query} LIMIT ? OFFSET ?`;
          queryValues = [...values, limit, offset];
        } else {
          paginatedQuery = query;
          queryValues = values;
        }

        // クエリを実行
        const stmt = await db.prepare(paginatedQuery);
        const rows = await stmt.all(queryValues);

        // 広告文本文とMeCab解析結果を取得する場合
        if (query.includes('Catch_Phrase_Body') || query.includes('MeCab_Result')) {
          if (rows.length > 0) {
            const result = rows.map(row => ({
              Catch_Phrase_Body: row.Catch_Phrase_Body,
              MeCab_Result: row.MeCab_Result,
              Year: row.Year, // 年
              Cacth_Phrase_Title: row.Cacth_Phrase_Title, // タイトル
              Advertiser: row.Advertiser, // 広告主
              Media: row.Media, // メディア
              Writers: row.Writers, // 作者
              Award: row.Award, // 賞
              Industry: row.Industry, // 業界
            }));
            res.status(200).json(result);
          } else {
            res.status(404).json({ error: 'No data found' });
          }
        } else {
          // 通常の検索結果を返す
          res.status(200).json(rows);
        }
      } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Database query failed', details: error.message });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to the database', details: error.message });
  }
}