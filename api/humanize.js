export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { text, tone } = req.body;

    const prompts = {
      formal: `You are an expert Thai human editor. Rewrite the text in a highly formal Thai tone. Return ONLY rewritten text.`,
      casual: `You are an expert Thai writer. Rewrite the text in a natural casual Thai tone. Return ONLY rewritten text.`,
      business: `You are an expert Thai business copywriter. Rewrite the text in a professional business tone. Return ONLY rewritten text.`,
      storytelling: `You are an expert Thai storyteller. Rewrite the text in storytelling style. Return ONLY rewritten text.`
    };

    const systemPrompt = prompts[tone] || prompts.formal;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: true,
        output: "❌ ระบบ Vercel หา GEMINI_API_KEY ไม่เจอ!"
      });
    }

    // เปลี่ยนชื่อโมเดลเป็น gemini-2.0-flash ตามเวอร์ชันที่เปิดใช้งานได้
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `SYSTEM:\n${systemPrompt}\n\nUSER:\n${text}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
       return res.status(200).json({
        success: true,
        output: `❌ Gemini API ฟ้องว่า: ${data.error.message}`
      });
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ไม่สามารถอ่านข้อความจาก AI ได้';

    res.status(200).json({
      success: true,
      output
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}
