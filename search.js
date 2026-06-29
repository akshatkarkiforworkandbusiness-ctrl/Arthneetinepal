import https from 'https';
https.get('https://api.github.com/search/code?q=repo:DavidHDev/react-bits+filename:Strands', { headers: { 'User-Agent': 'node.js' } }, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    if (json.items && json.items.length > 0) {
      console.log(json.items[0].html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/'));
    } else {
      console.log('Not found');
    }
  });
});
