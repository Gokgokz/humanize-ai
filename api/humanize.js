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
        output: "❌ หา Token ของ z.ai ไม่เจอในระบบ Environment Variables"
      });
    }

    // 🌐 เปลี่ยนมาใช้ Endpoint มาตรฐานของการเรียก AI Direct ที่มักจะเป็นลิงก์หลักของ z.ai
    // (หากทาง z.ai มีคู่มือระบุลิงก์เฉพาะ สามารถปรับตามคู่มือเขาได้เลยครับ)
    const response = await fetch('https://api.z.ai/v1/chat', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(200).json({
        success: true,
        output: `❌ เซิร์ฟเวอร์ z.ai ตอบกลับด้วยข้อผิดพลาด HTTP ${response.status}: ${errText}`
      });
    }

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({
        success: true,
        output: `❌ z.ai ฟ้อง Error: ${JSON.stringify(data.error)}`
      });
    }

    let output = '';
    if (data.choices?.[0]?.message?.content) {
      output = data.choices[0].message.content;
    } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      output = data.candidates[0].content.parts[0].text;
    } else if (data.output) {
      output = data.output;
    } else {
      output = `❌ โครงสร้างข้อมูลไม่ถูกต้อง ได้รับ: ${JSON.stringify(data)}`;
    }

    res.status(200).json({
      success: true,
      output: output.trim()
    });

  } catch (err) {
    console.log(err);
    res.status(200).json({
      success: true,
      output: `❌ ระบบภายในพัง (Catch Error): ${err.message}`
    });
  }
}
