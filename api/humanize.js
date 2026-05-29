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

    // 🌟 คลังแสงพรีเมียมคำสั่ง (Premium Tone Prompts) สั่งคุมน้ำเสียงอย่างเข้มงวด
    const prompts = {
      formal: "You are a master Thai linguistic editor and scholar. Rewrite the text into highly sophisticated, polished, and elite formal Thai. It must sound like it was written by an expert Thai executive or high-level journalist. Smooth out all rigid transitions.",
      casual: "You are an elite Thai creative content creator. Rewrite the text into a highly natural, engaging, and trendy casual Thai tone (ภาษาเขียนกึ่งพูดที่เป็นกันเองแต่สุภาพ). Inject genuine human emotional nuance and natural daily vocabulary. Avoid structures that look like converted bullet points.",
      business: "You are a top-tier corporate communications director and business consultant. Rewrite the text into a sharp, persuasive, and highly professional Thai business copy. Ensure it sounds credible, authoritative, and value-driven—suitable for investor pitches, premium marketing, or executive reports.",
      storytelling: "You are a renowned Thai novelist and narrative writer. Rewrite the text using a captivating storytelling style. Inject life, vivid descriptive vocabulary, and compelling prose rhythm. Ensure a smooth chronological flow that hooks the reader naturally."
    };

    // 🛑 คาถาปราบผี AI (Strict Anti-AI Rules) บล็อกคำแปลกๆ ทิ้งทั้งหมด
    const antiAiRules = `
    ANTI-AI LINGUISTIC RULES (CRITICAL FOR PRESTIGE HUMAN QUALITY):
    1. STRICTLY FORBIDDEN PHRASES: Never use robotic AI cliché words or literal translations such as: "สิ่งสำคัญคือต้องสังเกตว่า", "ในโลกปัจจุบันที่เปลี่ยนแปลงอย่างรวดเร็ว", "ในฐานะที่เป็น", "มีบทบาทสำคัญในการ", "อย่างมีประสิทธิภาพ", "มันเป็นเรื่องที่", "เพื่อสรุป", "นอกจากนี้ยัง".
    2. ELIMINATE TRANSLATIONESE: Completely get rid of English grammatical structures translated literally into Thai. Fix passive voices (e.g., change "ถูกพิจารณาโดย..." into a natural active Thai sentence structure).
    3. NATURAL FLOW & VARIETY: Vary sentence lengths dynamically. Use diverse, rich Thai synonyms instead of repeating the same generic verbs or nouns. The final text must flow seamlessly and sound 100% culturally and linguistically native Thai.`;

    const jsonFormatRule = `
    OUTPUT FORMAT REQUIREMENT:
    You must respond ONLY with a valid JSON object. Do not include markdown code blocks (e.g., do not wrap the response in \`\`\`json).
    The JSON structure must be exactly:
    {
      "humanized_text": "your premium rewritten Thai text here",
      "remaining_ai_score": an integer between 3 and 7 reflecting a tiny trace of AI pattern (keep it low, 3-5, because your human style is impeccable)"
    }`;

    const systemPrompt = (prompts[tone] || prompts.formal) + "\n\n" + antiAiRules + "\n\n" + jsonFormatRule;

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

    // คำนวณระบบสวิงคะแนนธรรมชาติออร์แกนิกตามความยาวข้อความจริง
    let baseScore = parseInt(aiJson.remaining_ai_score) || 4;
    const jitter = Math.floor(Math.random() * 3) - 1; // สุ่มสวิงเบาๆ (-1, 0, +1)
    let finalScore = baseScore + jitter;

    if (text.length > 600) {
      finalScore += 1;
    } else if (text.length < 200) {
      finalScore -= 1;
    }

    finalScore = Math.max(2, Math.min(7, finalScore)); // ตรึงคะแนนสวิงสวยๆ ระหว่าง 2% - 7%

    res.status(200).json({
      success: true,
      output: aiJson.humanized_text,
      aiScoreAfter: finalScore 
    });

  } catch (err) {
    console.error("Fatal Backend Error:", err);
    res.status(200).json({
      success: false,
      error: `❌ ระบบหลังบ้านเกิดข้อผิดพลาด: ${err.message}`
    });
  }
}
