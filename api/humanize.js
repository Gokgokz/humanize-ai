export default async function handler(req, res) {
  // 1. Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, output: 'Method Not Allowed' });
  }

  try {
    const { text, tone } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, output: 'กรุณาส่งข้อความ (text) มาด้วย' });
    }

    // 2. กำหนด System Prompt
    const prompts = {
      formal: 'You are an expert Thai human editor. Rewrite the text in a highly formal Thai tone. Return ONLY rewritten text.',
      casual: 'You are an expert Thai writer. Rewrite the text in a natural casual Thai tone. Return ONLY rewritten text.',
      business: 'You are an expert Thai business copywriter. Rewrite the text in a professional business tone. Return ONLY rewritten text.',
      storytelling: 'You are an expert Thai storyteller. Rewrite the text in storytelling style. Return ONLY rewritten text.'
    };

    const systemPrompt = prompts[tone] || prompts.formal;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        output: "❌ ไม่พบ GEMINI_API_KEY กรุณาตั้งค่า Environment Variables" 
      });
    }

    // 3. กำหนดชื่อโมเดลที่ถูกต้อง (ปัจจุบันคือ gemini-2.0-flash)
    // หากต้องการใช้รุ่นเก่าที่เสถียรมาก ๆ ให้เปลี่ยนเป็น gemini-1.5-flash
    const MODEL_ID = 'gemini-2.0-flash'; 

    // 4. เรียก API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ใช้ system_instruction แยกกับข้อความ user (แนะนำสำหรับ 1.5 และ 2.0)
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
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
      // ถ้า Error 404 ให้เช็คชื่อโมเดล
      if (response.status === 404) {
         return res.status(500).json({ 
            success: false, 
            output: `❌ ไม่พบโมเดลนี้ (${MODEL_ID}) กรุณาตรวจสอบชื่อโมเดล` 
         });
      }
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

    res.status(200).json({
      success: true,
      output: output.trim()
    });

  } catch (err) {
    console.error('Internal Error:', err);
    res.status(500).json({
      success: false,
      output: `❌ ระบบภายในพัง: ${err.message}`
    });
  }
}
