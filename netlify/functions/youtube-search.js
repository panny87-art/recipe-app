// netlify/functions/youtube-search.js
// YouTube 레시피 영상 검색
// API 키는 Netlify 환경변수 YOUTUBE_API_KEY 에서 가져옴

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const YT_KEY = process.env.YOUTUBE_API_KEY;

  // YouTube 키 없으면 videoId: null 반환 (링크 버튼으로 대체)
  if (!YT_KEY) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: null })
    };
  }

  try {
    const { recipeName } = JSON.parse(event.body);

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(recipeName + ' 레시피')}&type=video&maxResults=1&relevanceLanguage=ko&key=${YT_KEY}`
    );

    const data = await res.json();
    const videoId = data.items?.[0]?.id?.videoId || null;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    };

  } catch {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: null })
    };
  }
};
