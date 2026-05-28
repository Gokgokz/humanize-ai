export default async function handler(req, res) {
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
    const { text, tone } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        output: 'กรุณาใส่ข้อความ'
      });
    }

    const prompts = {
      formal: 'Rewrite in formal Thai tone.',
      casual: 'Rewrite in casual Thai tone.',
      business: 'Rewrite in professional business Thai tone.',
      storytelling: 'Rewrite in storytelling Thai style.'
    };

    const systemPrompt = prompts[tone] || prompts.formal;

    // เช็ก API KEY
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        output: '❌ ไม่พบ OPENROUTER_API_KEY'
      });
    }

    // ยิง OpenRouter
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
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

    const data = await response.json();

    console.log('OPENROUTER:', data);

    // ถ้ามี error
    if (data.error) {
      return res.status(500).json({
        success: false,
        output: `❌ ${JSON.stringify(data.error)}`
      });
    }

    const output = data?.choices?.[0]?.message?.content;

    // ถ้าไม่มี output
    if (!output) {
      return res.status(500).json({
        success: false,
        output: `❌ AI ไม่ตอบกลับ\n\n${JSON.stringify(data)}`
      });
    }

    return res.status(200).json({
      success: true,
      output: output.trim()
    });

  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      output: `❌ Server Error: ${err.message}`
    });
  }
}
