export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      output: 'Method Not Allowed'
    });
  }

  try {
    console.log('API START');

    const { text, tone } = req.body;

    console.log('BODY:', req.body);

    if (!text) {
      return res.status(400).json({
        success: false,
        output: 'กรุณาใส่ข้อความ'
      });
    }

    const prompts = {
      formal:
        'You are an expert Thai human editor. Rewrite the text in a highly formal Thai tone. Return ONLY rewritten text.',

      casual:
        'You are an expert Thai writer. Rewrite the text in a natural casual Thai tone. Return ONLY rewritten text.',

      business:
        'You are an expert Thai business copywriter. Rewrite the text in a professional business tone. Return ONLY rewritten text.',

      storytelling:
        'You are an expert Thai storyteller. Rewrite the text in storytelling style. Return ONLY rewritten text.'
    };

    const systemPrompt = prompts[tone] || prompts.formal;

    // เช็ก API KEY
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        output: '❌ ไม่พบ OPENROUTER_API_KEY ใน Vercel'
      });
    }

    // กันค้าง
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    // ยิง OpenRouter
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free',

          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: text
            }
          ]
        })
      }
    );

    clearTimeout(timeout);

    console.log('STATUS:', response.status);

    const data = await response.json();

    console.log('DATA:', data);

    // เช็ก error
    if (data.error) {
      return res.status(500).json({
        success: false,
        output: `❌ OpenRouter Error: ${data.error.message}`
      });
    }

    const output =
      data?.choices?.[0]?.message?.content ||
      'ไม่สามารถอ่านข้อความจาก AI ได้';

    console.log('SUCCESS');

    return res.status(200).json({
      success: true,
      output: output.trim()
    });

  } catch (err) {
    console.log('SERVER ERROR:', err);

    return res.status(500).json({
      success: false,
      output: `❌ Server Error: ${err.message}`
    });
  }
}
