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

    // 💡 รวบรวมรูปแบบ URL ยอดนิยมของ z.ai ที่เปิดให้บริการ
    // ระบบจะลองยิงอันแรกก่อน ถ้าเจอ 404 จะสลับไปยิงอันที่สองให้อัตโนมัติทันที
    const urlsToTry = [
      'https://api.z.ai/v1/chat/completions',
      'https://api.z.ai/v1/completions',
      'https://api.z.ai/chat/completions'
    ];

    let response;
    let lastErrorText = '';
    let successFetch = false;

    for (const url of urlsToTry) {
      try {
        response = await fetch(url, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // ใช้ชื่อโมเดลมาตรฐานที่ z.ai นิยมเปิดให้ใช้ในระบบ proxy
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text }
            ],
            temperature: 0.7
          })
        });

        // ถ้าไม่ใช่ 404 (แปลว่าเจอหน้าบ้านเขาแล้ว แต่อาจจะคีย์ผิดหรือโมเดลไม่มีสิทธิ์) ให้หยุดลองต่อทันที
        if (response.status !== 404) {
          successFetch = true;
          break;
        }
        
        lastErrorText = `ลองยิงไปที่ ${url} แล้วเจอ 404`;
      } catch (e) {
        lastErrorText = `เชื่อมต่อไม่ได้: ${e.message}`;
      }
    }

    // หากลองทุก URL แล้วยังเจอ 404 อยู่
    if (!successFetch || !response) {
      return res.status(200).json({
        success: true,
        output: `❌ ระบบทดลองยิงทุก Endpoint ของ z.ai แล้วยังขึ้น 404 (Not Found) แนะนำให้ตรวจสอบคู่มือหรือแผงควบคุมของ z.ai ว่าเขากำหนด Base URL ไว้ว่าอย่างไรครับ`
      });
    }

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
    } else if (data.choices?.[0]?.text) {
      output = data.choices[0].text;
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
