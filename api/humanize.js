export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { text, tone } = req.body;

    if (!text || text.trim() === "") {
      return res.status(200).json({
        success: false,
        error: "❌ หลังบ้านตรวจพบ: ไม่ได้รับข้อความต้นฉบับ"
      });
    }

    const prompts = {
      formal: `You are an expert Thai human editor. Rewrite the text in a highly formal Thai tone. Return ONLY rewritten text.`,
      casual: `You are an expert Thai writer. Rewrite the text in a natural casual Thai tone. Return ONLY rewritten text.`,
      business: `You are an expert Thai business copywriter. Rewrite the text in a professional business tone. Return ONLY rewritten text.`,
      storytelling: `You are an expert Thai storyteller. Rewrite the text in storytelling style. Return ONLY rewritten text.`
    };

    const systemPrompt = prompts[tone] || prompts.formal;

    // 💡 ลบตัวเช็ค Environment Variables เก่าออกแล้ว ยิงตรงหาคีย์นี้ทันที!
    // ⚠️ อย่าลืมเปลี่ยนคำว่า ใส่_API_KEY_ตรงนี้ ให้เป็นคีย์ OpenRouter จริงของคุณ (sk-or-v1-...)
    const MY_OPENROUTER_KEY = "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"; 

    // ติดต่อเซิร์ฟเวอร์ OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MY_OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://humanize-ai-rho.vercel.app", 
        "X-Title": "Humanize AI Thai"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ]
      })
    });

    if (!response.ok) {
      let errorMsg = "";
      try {
        const errData = await response.json();
        errorMsg = errData.error?.message || JSON.stringify(errData);
      } catch (e) {
        errorMsg = `HTTP Status ${response.status}`;
      }
      return res.status(200).json({
        success: false,
        error: `❌ OpenRouter ปฏิเสธการทำงาน: ${errorMsg}`
      });
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content;
    
    if (!output) {
      return res.status(200).json({
        success: false,
        error: `❌ ไม่สามารถแกะข้อความได้ โครงสร้างที่ได้รับ: ${JSON.stringify(data)}`
      });
    }

    res.status(200).json({
      success: true,
      output: output.trim()
    });

  } catch (err) {
    console.error("Fatal Backend Error:", err);
    res.status(200).json({
      success: false,
      error: `❌ ระบบหลังบ้านเกิดข้อผิดพลาด: ${err.message}`
    });
  }
}
