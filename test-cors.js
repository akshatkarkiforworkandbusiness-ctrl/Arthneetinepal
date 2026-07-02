const key = process.env.NVIDIA_API_KEY;
if (!key) {
  console.error('NVIDIA_API_KEY environment variable is not set.');
  console.error('Usage: NVIDIA_API_KEY=your_key node test-cors.js');
  process.exit(1);
}

async function testCORS() {
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://arthneti.pages.dev',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    });
    console.log("Status:", res.status);
    console.log("CORS Headers:");
    res.headers.forEach((val, key) => console.log(key + ':', val));
  } catch(e) {
    console.error(e);
  }
}
testCORS();
