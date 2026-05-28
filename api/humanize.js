const response = await fetch(
  'https://openrouter.ai/api/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
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

console.log(data);

const output =
  data?.choices?.[0]?.message?.content ||
  'ไม่สามารถอ่านข้อความจาก AI ได้';
