import axios from 'axios';

async function testFetch(url: string) {
  const userAgents = [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
  ];

  for (const ua of userAgents) {
    console.log(`\n--- Testing with UA: ${ua} ---`);
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });
      
      const html = response.data;
      const title = html.match(/<title>(.*?)<\/title>/)?.[1];
      const ogTitle = html.match(/property="og:title" content="(.*?)"/)?.[1];
      const ogDescription = html.match(/property="og:description" content="(.*?)"/)?.[1];
      
      console.log('Title:', title);
      console.log('OG Title:', ogTitle);
      console.log('OG Description:', ogDescription ? ogDescription.substring(0, 100) + '...' : 'Not found');
      
      if (ogTitle || ogDescription) {
        console.log('SUCCESS: Meta tags found!');
      } else {
        console.log('FAILED: No meta tags found.');
      }
    } catch (error: any) {
      console.error('Error:', error.message);
    }
  }
}

testFetch('https://www.instagram.com/reel/DS4w7UOkgIW/');
