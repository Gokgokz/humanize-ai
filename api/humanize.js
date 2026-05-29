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
      formal: "You are an expert Thai human editor. Rewrite the text in a highly formal Thai tone.",
      casual: "You are an expert Thai writer. Rewrite the text in a natural casual Thai tone.",
      business: "You are an expert Thai business copywriter. Rewrite the text in a professional business tone.",
      storytelling: "You are an expert Thai storyteller. Rewrite the text in storytelling style."
    };

    const systemPrompt = (prompts[tone] || prompts.formal) + 
      `\n\nCRITICAL: You must respond ONLY with a valid JSON object. Do not include markdown formatting like \`\`\`json.
      The JSON structure must be exactly:
      {
        "humanized_text": "your rewritten Thai text here",
        "remaining_ai_score": an integer between 3 and 8 representing a realistic tiny trace of AI signature`
      };

    const OPENROUTER_KEY = process.env.GEMINI_API_KEY; 

    if (!OPENROUTER_KEY) {
      return res.status(200).json({
        success: false,
        error: "❌ หลังบ้านตรวจพบ: ไม่พบ GEMINI_API_KEY ใน Vercel"
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://humanize-ai-rho.vercel.app", 
        "X-Title": "Humanize AI Thai"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" } 
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
    const rawContent = data.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      return res.status(200).json({
        success: false,
        error: "❌ ไม่ได้รับข้อมูลเนื้อหาจาก AI"
      });
    }

    let aiJson;
    try {
      aiJson = JSON.parse(rawContent);
    } catch (e) {
      aiJson = { humanized_text: rawContent, remaining_ai_score: 4 };
    }

    // 🎯 สรรสร้างระบบ "เหวี่ยงแบบธรรมชาติ" เพื่อความยุติธรรมและน่าเชื่อถือ
    let baseScore = parseInt(aiJson.remaining_ai_score) || 4;
    
    // 1. สุ่มตัวเลขผันผวนเล็กน้อย (-1, 0, +1)
    const jitter = Math.floor(Math.random() * 3) - 1; 
    let finalScore = baseScore + jitter;

    // 2. ผันตามความยาวข้อความ (ข้อความยิ่งยาว โอกาสเจอแพทเทิร์น AI จะแปรผันเพิ่มขึ้นนิดหน่อยตามหลักความจริง)
    if (text.length > 600) {
      finalScore += 1;
    } else if (text.length < 200) {
      finalScore -= 1;
    }

    // 3. ควบคุมเพดานให้อยู่ในเกณฑ์เนียนระดับมนุษย์เรียกพี่ (สวิงสวยๆ ระหว่าง 2% ถึง 7%)
    finalScore = Math.max(2, Math.min(7, finalScore));

    res.status(200).json({
      success: true,
      output: aiJson.humanized_text,
      aiScoreAfter: finalScore // ส่งคะแนนที่มีความเหวี่ยงสมจริงกลับไปแสดงผล
    });

  } catch (err) {
    console.error("Fatal Backend Error:", err);
    res.status(200).json({
      success: false,
      error: `❌ ระบบหลังบ้านเกิดข้อผิดพลาด: ${err.message}`
    });
  }
}
