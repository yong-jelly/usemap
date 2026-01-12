import axios from 'axios';

async function checkEmbeddedData(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    const html = response.data;
    console.log('HTML Length:', html.length);
    
    // Look for common JSON patterns in Instagram HTML
    const patterns = [
      /window\._sharedData\s*=\s*({.*?});/s,
      /script type="application\/ld\+json">(.*?)<\/script>/s,
      /{"xdt_api__v1__media__direct_path__.*?"}/s
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        console.log(`Found match with pattern: ${pattern}`);
        console.log('Data sample:', match[1].substring(0, 200));
      }
    }
    
    if (html.includes('login')) {
      console.log('Page seems to be redirecting to login or showing login screen.');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkEmbeddedData('https://www.instagram.com/reel/DS4w7UOkgIW/');
