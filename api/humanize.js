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

    // เช็คว่าคุณใส่ Token ของ z.ai ใน Vercel หรือยัง (เราใช้ชื่อแปรเดิมเพื่อจะได้ไม่ต้องลบใน Vercel)
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: true,
        output: "❌ ไม่พบ API Key หรือ Token ในระบบ Environment Variables ของ Vercel"
      });
    }

    // เรียกยิงไปที่เซิร์ฟเวอร์ของ z.ai (ใช้ OpenAI-compatible format ตามมาตรฐานของ z.ai)
    const response = await fetch('https://api.z.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` // เอาคีย์ของ z.ai ที่คุณมีไปใส่ในช่องเดิมของ Vercel ได้เลยครับ
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash', // หรือใส่ชื่อโมเดลที่ z.ai กำหนดให้ใช้ในแพ็กเกจของคุณ
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    // ดักจับ Error เผื่อทาง z.ai ฟ้องปัญหา
    if (data.error) {
      return res.status(200).json({
        success: true,
        output: `❌ z.ai API ฟ้องว่า: ${data.error.message || data.error}`
      });
    }

    // แกะข้อความที่เกลาเสร็จแล้วตามโครงสร้าง OpenAI/z.ai format
    const output = data.choices?.[0]?.message?.content || 'ไม่สามารถดึงข้อมูลจาก z.ai ได้';

    res.status(200).json({
      success: true,
      output: output.trim()
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}
