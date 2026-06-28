const { OpenAI } = require('openai');
require('dotenv').config();

const openrouter = new OpenAI({ 
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY 
});

async function test() {
  try {
    const res = await openrouter.chat.completions.create({
      model: 'qwen/qwen-vl-plus:free',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: "What is this?" },
            { type: 'image_url', image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=" } }
          ]
        }
      ],
      max_tokens: 100
    });
    console.log("Success:", res.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}
test();
