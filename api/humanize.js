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

    // 🌟 1. ปรับ Persona ใหม่: โหมด Casual กลายเป็น แอดมินเพจ Facebook มืออาชีพ
    const toneSettings = {
      formal: "You are a seasoned Thai executive and expert writer. Rewrite the text into a polished, authoritative, but highly readable Thai. Make it sound like an insightful op-ed in a top-tier business newspaper, not a generic textbook.",
      casual: "You are a highly successful Thai Facebook Page Admin and professional Content Creator. Rewrite the text into an engaging, highly shareable social media post. The tone should be friendly, relatable, and easy to digest (scroll-stopping). STRICTLY AVOID comical, gossipy, or overly slangy spoken particles like 'อ่ะ', 'อ่ะนะ', 'แก', 'เงี้ย', 'แบบว่า'. Use a smooth, conversational voice that sounds like a smart, approachable creator explaining something interesting to their followers.",
      business: "You are a top-level Thai corporate strategist. Rewrite the text to be sharp, concise, and highly impactful. Focus on clarity and momentum. Use professional business phrasing but avoid empty corporate buzzwords.",
      storytelling: "You are an award-winning Thai feature writer. Rewrite the text using narrative flow. Paint a picture, build context organically, and draw the reader in without using cliché hooks."
    };

    // 🧠 2. กฎทองคำแห่งการเขียนแบบมนุษย์ (The Organic Human Blueprint) - คงเดิม
    const deepLinguisticBlueprint = `
    CRITICAL HUMAN-WRITING ALGORITHM (MANDATORY):
    
    1. MAXIMIZE BURSTINESS (Vary Sentence Lengths):
       - Human writing is a mix of long, flowing thoughts and short, punchy statements. 
       - NEVER write paragraphs of uniform length. 
       - Mix 3-word sentences with 20-word sentences organically.

    2. ORGANIC THAI GRAMMAR (Omit Redundant Subjects):
       - AI always repeats the subject (e.g., "AI is good. AI can help us. AI is fast."). 
       - In natural Thai, humans OMIT the subject in subsequent sentences when the context is clear (ละประธาน). Do this frequently to sound like a native.

    3. NATURAL CONNECTORS (Kill the AI Conjunctions):
       - AVOID standard AI transition words: "นอกจากนี้", "อย่างไรก็ตาม", "ดังที่กล่าวไปแล้ว", "ท้ายที่สุดนี้", "สิ่งสำคัญคือต้องสังเกตว่า".
       - USE natural human connectors instead: "แต่", "พอถึงจุดนี้", "ที่น่าสนใจคือ", "จริงๆ แล้ว", "เรื่องก็คือ".

    4. NO FORCED TEMPLATES:
       - DO NOT use cliché hooks like "ลองนึกภาพว่า..." (Imagine that). Start organically based on the context.
       - DO NOT overuse ".." (double dots) or forced rhetorical questions. Let the narrative flow naturally.

    5. THE "ANTI-TRANSLATIONESE" RULE:
       - Never use passive voice when it's unnatural in Thai (e.g., "ถูกพัฒนาโดย" -> Use "พัฒนาโดย" or "สร้างขึ้นโดย").
       - Eliminate robotic summary phrases like "ในโลกดิจิทัลที่เปลี่ยนแปลงอย่างรวดเร็ว", "ก้าวไปข้างหน้า", "เป็นเครื่องพิสูจน์ว่า".
       
    The goal is to make the text sound like it was written by an incredibly articulate, smart, and empathetic human native Thai speaker. It must score 0% on AI detectors.
    `;

    const jsonFormatRule = `
    OUTPUT FORMAT REQUIREMENT:
    You must respond ONLY with a valid JSON object. Do not include markdown code blocks.
    The JSON structure must be exactly:
    {
      "humanized_text": "your perfectly humanized Thai text here",
      "remaining_ai_score": an integer between 1 and 5
    }`;

    const systemPrompt = (toneSettings[tone] || toneSettings.formal) + "\n\n" + deepLinguisticBlueprint + "\n\n" + jsonFormatRule;

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
          { role: "user", content: `Please humanize this text perfectly based on the rules:\n\n${text}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.85, 
        top_p: 0.9
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

    // ================= 🧼 เริ่มกระบวนการกวาดล้างเศษโค้ด =================
    let cleanedContent = rawContent.trim();
    cleanedContent = cleanedContent
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    let aiJson;
    try {
      aiJson = JSON.parse(cleanedContent);
    } catch (e) {
      const textMatch = cleanedContent.match(/"humanized_text"\s*:\s*"([\s\S]*?)"\s*[,}]/);
      if (textMatch && textMatch[1]) {
        aiJson = { humanized_text: textMatch[1], remaining_ai_score: 3 };
      } else {
        let fallbackText = cleanedContent
          .replace(/^[{\s]*"humanized_text"\s*:\s*"/, '')
          .replace(/"\s*,\s*"remaining_ai_score"[\s\S]*$/, '')
          .replace(/"\s*}[\s\S]*$/, '');
        aiJson = { humanized_text: fallbackText, remaining_ai_score: 3 };
      }
    }

    let finalOutput = aiJson.humanized_text 
      ? aiJson.humanized_text.replace(/\\n/g, '\n').replace(/\\"/g, '"') 
      : cleanedContent;
    // =================================================================================

    let baseScore = parseInt(aiJson.remaining_ai_score) || 3;
    const jitter = Math.floor(Math.random() * 3) - 1; 
    let finalScore = baseScore + jitter;
    finalScore = Math.max(1, Math.min(6, finalScore)); 

    res.status(200).json({
      success: true,
      output: finalOutput, 
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
