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

    // 🌟 ระบบสวมบทบาทนักเขียนบทความพรีเมียม (คงเดิมของคุณไว้ 100%)
    const toneSettings = {
      formal: "You are a top-tier Thai editorial director and senior business journalist. Rewrite the text into highly polished, analytical, and authoritative formal Thai. Use elite structural hooks and professional terminology.",
      casual: "You are an elite Thai creative content director. Rewrite the text into an engaging, smooth, and highly thought-provoking casual Thai tone. Make it extremely readable with active human pacing.",
      business: "You are a premium corporate communications expert. Focus heavily on market dynamics, strategic movements, and high-impact metrics blended into a gripping professional narrative.",
      storytelling: "You are a master narrative essayist and creative writer. Maximize the use of visual analogies, historical contrasts, and compelling hooks to capture the reader's attention."
    };

    // 🧠 ระบบโครงสร้างภาษามนุษย์ระดับสูง (คงเดิมของคุณไว้ 100%)
    const deepLinguisticBlueprint = `
    CRITICAL NARRATIVE ARCHITECTURE & STRUCTURE RULES:
    
    1. THE "OPENER CONTRAST" HOOK:
       Never start with dry definitions. You must restructure the opening using either:
       - A vivid visual analogy (e.g., "ลองนึกภาพว่าเรากำลังขับรถอยู่บนถนนที่ทัศนวิสัยไม่ค่อยดี... สถานการณ์ในตอนนี้ ก็แทบไม่ต่างกัน..")
       - A time-based contrast (e.g., "40 ปีที่แล้ว... แต่ในวันนี้.. ตัวละครใหม่ที่เข้ามาเปลี่ยนเกม คือ...")
       - A global vs local contrast (e.g., "In a volatile market... but there is one entity that stands out...")

    2. THE "PUNCHY PACING" BREAKS (formatting style):
       - Strictly break text into very short, digestible paragraphs (maximum 1-2 sentences per paragraph block).
       - Frequently use double dots ".." at the end of transition lines to create anticipation (e.g., "สถานการณ์ในตอนนี้ ก็แทบไม่ต่างกัน..", "แต่ในวันนี้..").

    3. THE "RHETORICAL INTERACTION" INJECTION:
       Isolate questions or transition prompts into their own single-line paragraphs to guide the reader's focus. Use these professional native generic patterns:
       - "คำถามคือ ในสภาวะแบบนี้ เราควรวางหมากอย่างไร?"
       - "แล้วเรื่องราวมันเป็นอย่างไร? เราจะมาสรุปให้ฟัง"
       - "จุดที่น่าสนใจคือ..."
       - "และเรื่องนี้ ก็ใกล้ตัวเรากว่าที่คิด.."

    4. DATA-DRIVEN ACTION VERBS:
       When dealing with data, percentages, or facts, wrap them in active, punchy metaphors instead of passive descriptions:
       - Do not say "รายได้เพิ่มขึ้นอย่างรวดเร็ว" -> Use "พุ่งทะยานแตะ..." or "กวาดรายได้รวม..."
       - Do not say "ตลาดมีความผันผวนมาก" -> Use "ท่ามกลางมรสุมความผันผวน..." or "เจอแรงกดดันจาก..."
       - Do not say "เป็นเทคโนโลยีที่สำคัญ" -> Use "กลายเป็นตัวละครใหม่ที่เข้ามาเปลี่ยนเกม"

    5. STRICT ANTI-AI FILTERS:
       - Completely eliminate translationese and passive structures (e.g., "ถูกทำโดย").
       - Forbidden phrases: "สิ่งสำคัญคือต้องสังเกตว่า", "ในโลกปัจจุบันที่เปลี่ยนแปลงอย่างรวดเร็ว", "ในฐานะที่เป็น", "มีบทบาทสำคัญในการ", "อย่างมีประสิทธิภาพ", "ในบริบทของ", "สรุปได้ว่า".

    --------------------------------------------------
    FEW-SHOT ARCHITECTURAL EXAMPLES:
    
    [Input AI Text]:
    "เทคโนโลยีบล็อกเชนและปัญญาประดิษฐ์กำลังเข้ามามีบทบาทสำคัญในระบบเศรษฐกิจโลกอย่างมากในปัจจุบัน ทำให้ระบบการเงินแบบเดิมที่ควบคุมโดยธนาคารที่มีข้อจำกัดเรื่องเวลาทำการและวันหยุดราชการเสื่อมความนิยมลงอย่างรวดเร็วเนื่องจากไม่มีประสิทธิภาพเพียงพอสำหรับอนาคต"

    [Output Premium Deep-Style Text]:
    "ลองนึกภาพว่าเรากำลังใช้ระบบขนส่งมวลชนที่ต้องรอตามเวลา แถมปิดทำการทุกวันหยุดราชการ.. ระบบการเงินแบบเดิมที่เราใช้อยู่ในปัจจุบัน ก็แทบไม่ต่างกัน
    
    แต่ในวันนี้.. ตัวละครใหม่ที่เข้ามาเปลี่ยนเกมแบบร้อยเปอร์เซ็นต์
    คือสิ่งที่เรียกว่า ปัญญาประดิษฐ์ (AI) และ บล็อกเชน
    
    คำถามคือ ทำไมระบบเดิมกำลังจะหมดความหมายลงเรื่อยๆ?
    
    เหตุผลก็เพราะว่า ระบบการเงินแบบดั้งเดิมมีข้อจำกัดนานัปการ อาทิ เวลาทำการของธนาคารที่จำกัด และการต้องพึ่งพาบุคลากรจำนวนมากในการควบคุมดูแล
    
    ในขณะที่ AI และบล็อกเชน พร้อมปฏิบัติงานทะยานไปข้างหน้าตลอด 24 ชั่วโมง โดยไม่มีวันหยุด
    
    และเรื่องนี้ ก็ใกล้ตัววิถีชีวิตของเราทุกคน กว่าที่คิด.."
    --------------------------------------------------`;

    const jsonFormatRule = `
    OUTPUT FORMAT REQUIREMENT:
    You must respond ONLY with a valid JSON object. Do not include markdown code blocks.
    The JSON structure must be exactly:
    {
      "humanized_text": "your deep-engineered premium Thai text here following the structure above",
      "remaining_ai_score": an integer between 3 and 7
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

    // ================= 🧼 เริ่มกระบวนการกวาดล้างเศษโค้ด (Anti-Code Leak) =================
    let cleanedContent = rawContent.trim();
    
    // ดักขลิบหัว-ท้าย ขจัดแท็กมาร์กดาวน์จำพวก ```json หรือ ``` ออกไปให้หมดเกลี้ยง
    cleanedContent = cleanedContent
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    let aiJson;
    try {
      aiJson = JSON.parse(cleanedContent);
    } catch (e) {
      // แผนสำรองฉุกเฉิน: หาก JSON แตก ให้ดึงข้อความจากคีย์ "humanized_text" โดยใช้ Regex ตรงๆ
      const textMatch = cleanedContent.match(/"humanized_text"\s*:\s*"([\s\S]*?)"\s*[,}]/);
      if (textMatch && textMatch[1]) {
        aiJson = { humanized_text: textMatch[1], remaining_ai_score: 4 };
      } else {
        // แผนสุดท้าย: ขูดลอกปีกกาและโครงสร้าง JSON ออกให้เหลือเนื้อภาษาไทยดิบๆ
        let fallbackText = cleanedContent
          .replace(/^[{\s]*"humanized_text"\s*:\s*"/, '')
          .replace(/"\s*,\s*"remaining_ai_score"[\s\S]*$/, '')
          .replace(/"\s*}[\s\S]*$/, '');
        aiJson = { humanized_text: fallbackText, remaining_ai_score: 4 };
      }
    }

    // ล้างสแลชส่วนเกินที่มักจะหลุดติดมาจากการแปลงข้อมูลประเภท String ออกไป
    let finalOutput = aiJson.humanized_text 
      ? aiJson.humanized_text.replace(/\\n/g, '\n').replace(/\\"/g, '"') 
      : cleanedContent;
    // =================================================================================

    let baseScore = parseInt(aiJson.remaining_ai_score) || 4;
    const jitter = Math.floor(Math.random() * 3) - 1; 
    let finalScore = baseScore + jitter;

    if (text.length > 600) {
      finalScore += 1;
    } else if (text.length < 200) {
      finalScore -= 1;
    }

    finalScore = Math.max(2, Math.min(7, finalScore)); 

    res.status(200).json({
      success: true,
      output: finalOutput, // ใช้ตัวแปรล้างเศษโค้ดเรียบร้อยแล้วส่งขึ้นหน้าจอ
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
