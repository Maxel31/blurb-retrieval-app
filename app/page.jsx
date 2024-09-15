"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link"; // Linkコンポーネントを使用

function MainComponent() {
  const mediaOptions = [
    '', '新聞', 'ポスター', 'TVCM', 'WEB', '雑誌', 'その他', 'ラジオCM', 'ネーミング', 'パンフレット'
  ];

  const awardOptions = [
    '', 'TCCグランプリ', 'TCC賞', '審査委員長賞', 'ファイナリスト', 'ノミネート', '最高新人賞', '新人賞', 
    '一般部門賞', 'TCCクラブ賞', 'TCC最高賞', 'TCC広告賞', '部門賞', '特別賞', '会長賞', '奨励賞'
  ];

  const industryOptions = [
    '', '食品・飲料', '酒類・タバコ', '化粧品・薬品・サイエンス・日用雑貨', 
    '家庭電器・AV機器・コンピュータ・OA機器・通信機器・ビジネス用品・電信電話サービス', 
    '金融・保険・公共・教育および学校', 'デパート・スーパー・専門店（流通）・繊維・ファッション', 
    '娯楽（公営ギャンブル・遊園地）・スポーツおよびスポーツ用品・各種の民間イベントやリサイタルやショー・音楽関係', 
    '自動車・バイク・自転車・モーターボート・タイヤ・ガソリンなど交通関連機材とサービス', 
    '精密機器・産業資材・住宅・不動産', 'マスコミ・出版', 
    '貨物運輸・旅客運輸（鉄道・船舶・飛行機会社）・観光サービス（ホテル・自治体観光ポスター）', 
    'その他（どこに属するか不明なもの）', 'ネーミング・カタログ・パンフレット'
  ];

  const [searchParams, setSearchParams] = React.useState({
    yearStart: '',
    yearEnd: '',
    広告文タイトル: '',
    // 広告主: '',
    メディア: '',
    // 作者: '',
    賞: '',
    業界: '',
  });
  const [searchResults, setSearchResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [sortField, setSortField] = React.useState(null);
  const [sortOrder, setSortOrder] = React.useState('asc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [resultsPerPage, setResultsPerPage] = React.useState(20); // ページサイズをstateに変更
  const [infoMessage, setInfoMessage] = useState(null);
  const [infoType, setInfoType] = useState("info"); // "info" or "error"

  // ウィンドウサイズに応じてページサイズを変更
  React.useEffect(() => {
    const updateResultsPerPage = () => {
      if (window.innerWidth < 640) {
        setResultsPerPage(10); // 小さい画面では10件表示
      } else if (window.innerWidth < 1024) {
        setResultsPerPage(15); // 中くらいの画面では15件表示
      } else {
        setResultsPerPage(20); // 大きい画面では20件表示
      }
    };

    window.addEventListener('resize', updateResultsPerPage);
    updateResultsPerPage(); // 初回ロード時に実行

    return () => window.removeEventListener('resize', updateResultsPerPage);
  }, []);
  

  // 初回ロード時に全データを取得
  React.useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/db/catch_phrases_db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'SELECT `id`, `Year`, `Cacth_Phrase_Title`, `Advertiser`, `Media`, `Writers`, `Award`, `Industry` FROM `catch_phrases_v2`', values: [] }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error fetching all data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };


  // 一定時間後にinfoMessageを消す
  useEffect(() => {
    if (infoMessage) {
      const timer = setTimeout(() => {
        setInfoMessage(null);
      }, 3000); // 3秒後に消える

      return () => clearTimeout(timer); // クリーンアップ
    }
  }, [infoMessage]);

  const handleSearch = async () => {
    const isEmptySearch = Object.values(searchParams).every(value => value === '');
    if (isEmptySearch) {
      setInfoMessage("検索条件を入力してください。"); // エラーメッセージ
      setInfoType("error"); // エラーマークを表示
      return;
    }
  
    setLoading(true);
    try {
      let query = 'SELECT `id`, `Year`, `Cacth_Phrase_Title`, `Advertiser`, `Media`, `Writers`, `Award`, `Industry` FROM `catch_phrases_v2` WHERE 1=1';
      const values = [];
  
      if (searchParams.yearStart) {
        query += ' AND `Year` >= ?';
        values.push(searchParams.yearStart);
      }
      if (searchParams.yearEnd) {
        query += ' AND `Year` <= ?';
        values.push(searchParams.yearEnd);
      }
  
      // 広告文タイトルの部分一致検索
      if (searchParams.広告文タイトル) {
        query += ' AND `Cacth_Phrase_Title` LIKE ?';
        values.push(`%${searchParams.広告文タイトル}%`);
      }
  
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value && key !== 'yearStart' && key !== 'yearEnd' && key !== '広告文タイトル') {
          const dbKey = {
            '広告主': 'Advertiser',
            'メディア': 'Media',
            '作者': 'Writers',
            '賞': 'Award',
            '業界': 'Industry'
          }[key];
          query += ` AND \`${dbKey}\` LIKE ?`;
          values.push(`%${value}%`);
        }
      });
  
      // ページ番号と1ページあたりの件数をAPIに渡す
      const response = await fetch('/api/db/catch_phrases_db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, values, page: currentPage, resultsPerPage }),
      });
  
      if (!response.ok) {
        throw new Error('Search failed');
      }
  
      const data = await response.json();
      setSearchResults(data);
      setCurrentPage(1); // 検索後は1ページ目に戻す
      setInfoMessage("検索が完了しました。"); // 検索完了時のメッセージ
      setInfoType("info"); // 通常のinfoマークを表示
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);

    const sortedResults = [...searchResults].sort((a, b) => {
      if (field === 'Year') {
        return newOrder === 'asc' ? a.Year - b.Year : b.Year - a.Year;
      }
      return 0;
    });

    setSearchResults(sortedResults);
  };

  const handleReset = () => {
    setSearchParams({
      yearStart: '',
      yearEnd: '',
      広告文タイトル: '',
      メディア: '',
      賞: '',
      業界: '',
    });
    setInfoMessage("検索条件がリセットされました。"); // リセット時のメッセージ
  };

  // ページネーションのためのデータ分割
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = searchResults.slice(indexOfFirstResult, indexOfLastResult);

  // ページ変更
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ページネーションボタンの表示
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);

  return (
    <div className="w-full h-full min-h-screen bg-blue-50 flex flex-col items-center justify-start"> {/* w-full, h-full, flex, items-centerを追加 */}
      <div className="w-full max-w-7xl px-6 py-12"> {/* max-w-7xlで中央寄せ */}
        <h1 className="text-6xl font-bold mb-8 text-center text-blue-800">広告文検索システム</h1>
        <div>
          <label className="block text-sm font-medium text-black">年（開始）</label>
          <input
            type="number"
            name="yearStart"
            placeholder="開始年"
            value={searchParams.yearStart}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black">年（終了）</label>
          <input
            type="number"
            name="yearEnd"
            placeholder="終了年"
            value={searchParams.yearEnd}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black">メディア</label>
          <select
            name="メディア"
            value={searchParams.メディア}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-black"
          >
            {mediaOptions.map(option => (
              <option key={option} value={option}>{option || '指定なし'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-black">賞</label>
          <select
            name="賞"
            value={searchParams.賞}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-black"
          >
            {awardOptions.map(option => (
              <option key={option} value={option}>{option || '指定なし'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-black">業界</label>
          <select
            name="業界"
            value={searchParams.業界}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-black"
          >
            {industryOptions.map(option => (
              <option key={option} value={option}>{option || '指定なし'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-black">広告文タイトル</label>
          <input
            type="text"
            name="広告文タイトル"
            placeholder="広告文タイトル"
            value={searchParams.広告文タイトル}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-black"
          />
        </div>
      </div>

      {/* Info Toast (右上に表示、背景色を白に設定) */}
      {infoMessage && (
        <div className="fixed top-4 right-4 max-w-xs bg-white border border-gray-200 rounded-xl shadow-lg" role="alert">
          <div className="flex p-4">
            <div className="shrink-0">
              {infoType === "info" ? (
                <svg className="shrink-0 size-4 text-blue-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"></path>
                </svg>
              ) : (
                <svg className="shrink-0 size-4 text-red-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"></path>
                </svg>
              )}
            </div>
            <div className="ms-3">
              <p className="text-sm text-gray-700">{infoMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-10"> {/* gap-10でボタン間に余白を追加 */}
        <button
          onClick={handleSearch}
          className="w-auto min-w-[150px] py-2 px-10 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
          disabled={loading}
        >
          {loading ? '検索中...' : '検索'}
        </button>
        <button
          onClick={handleReset}
          className="w-auto min-w-[150px] py-2 px-5 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
        >
          リセット
        </button>
      </div>
      <div className="mt-8 w-full px-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-800">検索結果 ({searchResults.length}件)</h2>
        {searchResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left text-black">
                    年
                    <button onClick={() => handleSort('Year')} className="ml-2">
                      {sortField === 'Year' ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅'}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-black">広告文タイトル</th>
                  <th className="px-4 py-2 text-left text-black">広告主</th>
                  <th className="px-4 py-2 text-left text-black">メディア</th>
                  <th className="px-4 py-2 text-left text-black">作者</th>
                  <th className="px-4 py-2 text-left text-black">賞</th>
                  <th className="px-4 py-2 text-left text-black">業界</th>
                  <th className="px-4 py-2 text-left text-black">詳細</th>
                </tr>
              </thead>
              <tbody>
                {currentResults.map((result, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                    <td className="px-4 py-2 border-t text-black">{result.Year}</td>
                    <td className="px-4 py-2 border-t text-black">{result.Cacth_Phrase_Title}</td>
                    <td className="px-4 py-2 border-t text-black">{result.Advertiser}</td>
                    <td className="px-4 py-2 border-t text-black">{result.Media}</td>
                    <td className="px-4 py-2 border-t text-black">{result.Writers}</td>
                    <td className="px-4 py-2 border-t text-black">{result.Award}</td>
                    <td className="px-4 py-2 border-t text-black">{result.Industry}</td>
                    <td className="px-4 py-2 border-t">
                      <Link href={`/mecab_result/${result.id}`}>
                        <button className="py-0.3 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-full border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none">
                          詳細
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ページネーション */}
            <div className="mt-4 flex justify-center">
              {/* Previewボタン */}
              {currentPage > 1 && (
                <button
                  onClick={() => paginate(currentPage - 1)}
                  className="mx-1 px-3 py-1 border rounded bg-white text-blue-500"
                >
                  Preview
                </button>
              )}

              {/* 現在のページの前後のページボタン */}
              {currentPage > 2 && (
                <button
                  onClick={() => paginate(currentPage - 1)}
                  className="mx-1 px-3 py-1 border rounded bg-white text-blue-500"
                >
                  {currentPage - 1}
                </button>
              )}
              <button className="mx-1 px-3 py-1 border rounded bg-blue-500 text-white">
                {currentPage}
              </button>
              {currentPage < totalPages - 1 && (
                <button
                  onClick={() => paginate(currentPage + 1)}
                  className="mx-1 px-3 py-1 border rounded bg-white text-blue-500"
                >
                  {currentPage + 1}
                </button>
              )}

              {/* Nextボタン */}
              {currentPage < totalPages && (
                <button
                  onClick={() => paginate(currentPage + 1)}
                  className="mx-1 px-3 py-1 border rounded bg-white text-blue-500"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-blue-600">検索結果がありません。</p>
        )}
      </div>
    </div>
  );
}

export default MainComponent;