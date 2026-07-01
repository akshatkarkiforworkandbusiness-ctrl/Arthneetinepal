const key = process.env.NVIDIA_API_KEY;
if (!key) {
  console.error('NVIDIA_API_KEY environment variable is not set.');
  console.error('Usage: NVIDIA_API_KEY=your_key node test-nvidia.js');
  process.exit(1);
}

const prompt = "Hello";

async function test() {
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 100,
      })
    });
    console.log(res.status, res.statusText);
    const data = await res.json();
    console.log(data);
  } catch(e) {
    console.error(e);
  }
}
test();
