const key = "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";

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
