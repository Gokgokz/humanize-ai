export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false
    });
  }

  try {
    const { text, tone } = req.body;

    const prompts = {
      formal: 'Rewrite in formal Thai tone.',
      casual: 'Rewrite in casual Thai tone.',
      business: 'Rewrite in professional business Thai tone.',
      storytelling: 'Rewrite in storytelling Thai style.'
    };

    const systemPrompt = prompts[tone] || prompts.formal;

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

    const output =
      data?.choices?.[0]?.message?.content ||
      'AI ไม่ตอบกลับ';

    return res.status(200).json({
      success: true,
      output
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      output: err.message
    });
  }
}
