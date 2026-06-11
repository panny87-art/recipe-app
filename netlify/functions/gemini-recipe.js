// netlify/functions/gemini-recipe.js
// 레시피 생성 (Gemini API)
// API 키는 Netlify 환경변수 GEMINI_API_KEY 에서 가져옴

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
          return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
          return {
                  statusCode: 500,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: 'API 키가 서버에 설정되지 않았습니다.' })
          };
    }

    try {
          const { ingredients, seasonings } = JSON.parse(event.body);
          const ingrTxt = ingredients.map(i => `${i.name} ${i.amount}`).join(', ');

      const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                              contents: [{
                                            parts: [{
                                                            text: `식재료: ${ingrTxt}
                                                            보유 양념: ${seasonings.join(', ')}

                                                            위 재료로 만들 수 있는 요리 6가지를 추천해주세요.
                                                            조건: 현실적으로 조리 가능한 것 위주 / 보유 재료만으로 가능한 것 우선 / 다양한 시간놌난이도 구성

                                                            JSON 형식으로만 응답(설명 없이):
                                                            {"recipes":[{
                                                              "name":"요리명",
                                                                "emoji":"이모지1개",
                                                                  "time":15,
                                                                    "difficulty":"쉽기",
                                                                      "calories":250,
                                                                        "canMakeNow":true,
                                                                          "extraIngredients":["추가로 필요한 재료"],
                                                                            "ingredients":[{"name":"재료명","amount":"양","have":true}],
                                                                              "steps":[{"text":"조리 단계","tip":"요리 팁(없으면 빈 문자열)"}]
                                                                              }]}`
                                            }]
                              }]
                  })
        }
            );

      if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error?.message || 'Gemini API 오류');
      }

      const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);

      return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(parsed)
      };

    } catch (err) {
          return {
                  statusCode: 500,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: err.message || '레시피 생성 실패' })
          };
    }
};
