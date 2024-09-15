"use client"; // Client Componentとして扱う

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // useParamsを使用してURLパラメータを取得

function MeCabResultPage() {
  const { id } = useParams(); // URLからidを取得
  const [catchPhraseBody, setCatchPhraseBody] = useState('');
  const [mecabResult, setMecabResult] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredToken, setHoveredToken] = useState(null); // ホバー中のトークン
  const [adInfo, setAdInfo] = useState({}); // 広告文のその他の情報
  const [showPopup, setShowPopup] = useState(false); // ポップアップ表示/非表示の状態
  const [infoMessage, setInfoMessage] = useState(null); // infoメッセージ用のstate
  // const [infoType, setInfoType] = useState("info"); 

  const downloadCSV = () => {
    const csvRows = [];

    // 広告文情報をCSV形式に変換
    const adInfoHeaders = ['年', '広告主', 'メディア', '作者', '賞', '業界'];
    const adInfoValues = [adInfo.year, adInfo.advertiser, adInfo.media, adInfo.writers, adInfo.award, adInfo.industry];
    csvRows.push(adInfoHeaders.join(','));
    csvRows.push(adInfoValues.join(','));

    // 広告文本文と形態素解析結果をCSV形式に変換
    csvRows.push('\n広告文本文');
    csvRows.push(catchPhraseBody);

    csvRows.push('\n形態素解析結果');
    const mecabHeaders = ['表層形', '品詞', '品詞細分類1', '品詞細分類2', '品詞細分類3', '原形', '読み', '発音'];
    csvRows.push(mecabHeaders.join(','));

    mecabResult.forEach(word => {
      const row = [
        word.surface_form,
        word.word_class,
        word.class_detail1,
        word.class_detail2 || 'None',
        word.class_detail3 || 'None',
        word.original_form,
        word.katakana,
        word.pronunciation
      ];
      csvRows.push(row.join(','));
    });

    // CSVデータをBlobに変換してダウンロード
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${adInfo.title || '広告文'}_解析結果.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // CSVダウンロード完了のinfoメッセージを表示
    setInfoMessage("CSVファイルがダウンロードされました。");
    setInfoType("info");
  };

  const togglePopup = () => {
    setShowPopup(!showPopup);
    setInfoMessage(showPopup ? "形態素解析の結果を非表示にしました。" : "形態素解析の結果を表示しました。");
    // setInfoType("info"); // 削除: setInfoTypeは不要
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // 広告文本文とMeCab解析結果、その他の情報を取得
      const response = await fetch(`/api/db/catch_phrases_db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'SELECT `Catch_Phrase_Body`, `MeCab_Result`, `Year`, `Cacth_Phrase_Title`, `Advertiser`, `Media`, `Writers`, `Award`, `Industry` FROM `catch_phrases_v2` WHERE `id` = ?',
          values: [id],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setCatchPhraseBody(data[0].Catch_Phrase_Body);
      setMecabResult(JSON.parse(data[0].MeCab_Result)); // MeCab結果はJSON形式で保存されていると仮定
      setAdInfo({
        year: data[0].Year,
        title: data[0].Cacth_Phrase_Title,
        advertiser: data[0].Advertiser,
        media: data[0].Media,
        writers: data[0].Writers,
        award: data[0].Award,
        industry: data[0].Industry,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData(); // fetchDataを直接呼び出す
    }
  }, [id]); // fetchDataを依存関係から削除

  if (loading) {
    return <p>読み込み中...</p>;
  }

  // 品詞に基づいて色を決定する関数
  const getHighlightColor = (wordClass) => {
    switch (wordClass) {
      case '名詞':
        return 'bg-yellow-200';
      case '動詞':
        return 'bg-green-200';
      case '形容詞':
        return 'bg-blue-200';
      case '助詞':
        return 'bg-red-200';
      case '助動詞':
        return 'bg-purple-200';
      default:
        return 'bg-gray-200';
    }
  };

  // トークンにホバーした際にポップアップを表示する関数
  const handleMouseEnter = (index) => {
    setHoveredToken(index);
  };

  const handleMouseLeave = () => {
    setHoveredToken(null);
  };

  return (
    <div className="w-full h-full min-h-screen bg-blue-50 flex flex-col items-center justify-start relative">
        {/* ホーム画面に戻るアイコンボタンを左上に配置 */}
        <span
            className="absolute top-4 left-4 inline-flex justify-center items-center size-[46px] rounded-full bg-blue-600 text-white dark:bg-blue-500 cursor-pointer"
            onClick={() => window.location.href = '/'}
        >
            <svg className="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
        </span>

        <div className="mx-20 mb-8 mt-12"> {/* 左右に余白を開けて、少し下に配置するためにマージンを追加 */}
          <h1 className="text-5xl font-bold mb-6 text-center text-blue-800">{adInfo.title}</h1>
        </div>

        {/* 広告文情報を右上に移動 */}
        <div className="mb-8 relative px-20 mt-20"> {/* 上に余白を追加して重なりを防ぐ */}
          <h2 className="text-2xl font-semibold mb-4 text-blue-800">広告文情報</h2>
          <ul className="list-disc list-inside text-lg text-black bg-white p-4 rounded-md shadow-md">
              <li><strong>年:</strong> {adInfo.year}</li>
              <li><strong>広告主:</strong> {adInfo.advertiser}</li>
              <li><strong>メディア:</strong> {adInfo.media}</li>
              <li><strong>作者:</strong> {adInfo.writers}</li>
              <li><strong>賞:</strong> {adInfo.award}</li>
              <li><strong>業界:</strong> {adInfo.industry}</li>
          </ul>
        </div>

      {/* Info Toast (右上に表示) */}
      {infoMessage && (
        <div className="fixed top-4 right-4 max-w-xs bg-white border border-gray-200 rounded-xl shadow-lg" role="alert">
          <div className="flex p-4">
            <div className="shrink-0">
              <svg className="shrink-0 size-4 text-blue-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"></path>
              </svg>
            </div>
            <div className="ms-3">
              <p className="text-sm text-gray-700">{infoMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* 広告文本文の表示 */}
      <div className="mb-8 relative px-20 mt-20">
        <h2 className="text-2xl font-semibold mb-4 text-blue-800">広告文本文</h2>
        <button
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={togglePopup}
        >
          {showPopup ? '形態素解析の結果を非表示' : '形態素解析の結果を表示'}
      </button>
      <button
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded ml-4"
          onClick={downloadCSV}
        >
          .csv形式でダウンロード
        </button>
      <p className="text-lg text-black bg-white p-4 rounded-md shadow-md">
        {mecabResult.map((word, index) => (
          <span
            key={index}
            className={`relative ${showPopup ? getHighlightColor(word.word_class) : ''} px-1 rounded`} // showPopupがtrueのときのみハイライト
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: 'pointer', marginRight: '4px' }}
          >
            {word.surface_form}
            {/* ポップアップの表示 */}
            {hoveredToken === index && showPopup && ( // showPopupがtrueのときのみ表示
              <div className="absolute bg-white border border-gray-300 p-2 rounded shadow-lg z-10" style={{ top: '100%', left: 0 }}>
                <p><strong>表層形:</strong> {word.surface_form}</p>
                <p><strong>品詞:</strong> {word.word_class}</p>
                <p><strong>品詞細分類1:</strong> {word.class_detail1}</p>
                <p><strong>品詞細分類2:</strong> {word.class_detail2 || 'None'}</p>
                <p><strong>品詞細分類3:</strong> {word.class_detail3 || 'None'}</p>
                <p><strong>原形:</strong> {word.original_form}</p>
                <p><strong>読み:</strong> {word.katakana}</p>
                <p><strong>発音:</strong> {word.pronunciation}</p>
              </div>
            )}
          </span>
        ))}
      </p>
    </div>
    </div>
  );
}

export default MeCabResultPage;