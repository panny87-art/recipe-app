// netlify/functions/gemini-analyze.js
// 식재료 사진 분석 (Gemini Vision API)
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
                                              const { images, seasonings } = JSON.parse(event.body);

                                                  const parts = images.map(img => ({
                                                        inline_data: { mime_type: 'image/jpeg', data: img }
                                                            }));

                                                                parts.push({
                                                                      text: `첨부된 사진에서 식재료를 모두 찾아 분석해주세요.
                                                                      보유 양념(레시피 추천에 활용): ${seasonings.join(', ')}

                                                                      아래 JSON 형식으로만 응답해주세요(설명 없이):
                                                                      {"ingredients":[{"name":"식재료명","amount":"대략적인 양(예:1/2개,100g,3개)","condition":"신선함 또는 사용가능 또는 주의필요","conditionDetail":"한 줄 상태 설명"}]}`
                                                                          });

                                                                              const res = await fetch(
                                                                                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
                                                                                          {
                                                                                                  method: 'POST',
                                                                                                          headers: { 'Content-Type': 'application/json' },
                                                                                                                  body: JSON.stringify({ contents: [{ parts }] })
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
                                                                                                                                                                                                                  body: JSON.stringify({ error: err.message || '분석 실패' })
                                                                                                                                                                                                                      };
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                        };
