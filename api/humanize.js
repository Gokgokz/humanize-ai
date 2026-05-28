export default async function handler(req, res) {
  // 1. Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. ตรวจสอบ Method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, output: 'Method Not Allowed' });
  }

  try {
    const { text, tone } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, output: 'กรุณาส่งข้อความ (text) มาด้วย' });
    }

    // 3. กำหนด System Instruction
    const prompts = {
      formal: 'You are an expert Thai human editor. Rewrite the text in a highly formal Thai tone. Return ONLY rewritten text.',
      casual: 'You are an expert Thai writer. Rewrite the text in a natural casual Thai tone. Return ONLY rewritten text.',
      business: 'You are an expert Thai business copywriter. Rewrite the text in a professional business tone. Return ONLY rewritten text.',
      storytelling: 'You are an expert Thai storyteller. Rewrite the text in storytelling style. Return ONLY rewritten text.'
    };

    const systemPrompt = prompts[tone] || prompts.formal;

    if (!process.env.GEMINI_API_KEY) {
      // ควรเป็น 500 เพราะเป็นปัญหาที่ Server Config
      return res.status(500).json({ 
        success: false, 
        output: "❌ ไม่พบ GEMINI_API_KEY กรุณาตั้งค่า Environment Variables ใน Vercel" 
      });
    }

    // 4. เรียก API โดยใช้โครงสร้าง system_instruction
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ใส่ System Prompt แยกที่นี่
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          // ใส่ข้อความของ User ที่นี่
          contents: [
            {
              parts: [{ text: text }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini Error:', errText);
      return res.status(502).json({ 
        success: false, 
        output: `❌ Gemini API Error (${response.status}): ${errText}` 
      });
    }

    const data = await response.json();

    if (data.error) {
      return res.status(502).json({ 
        success: false, 
        output: `❌ Gemini API ฟ้องว่า: ${data.error.message}` 
      });
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ไม่สามารถอ่านข้อความจาก AI ได้';

    // 5. ส่งผลลัพธ์สำเร็จ
    res.status(200).json({
      success: true,
      output: output.trim()
    });

  } catch (err) {
    console.error('Internal Error:', err);
    res.status(500).json({
      success: false,
      output: `❌ ระบบภายในพัง (Catch Error): ${err.message}`
    });
  }
}
