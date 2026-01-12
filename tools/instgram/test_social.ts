import axios from 'axios';

async function testSocialUA(url: string) {
  const ua = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';
  console.log(`\n--- Testing with UA: ${ua} ---`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': ua,
      }
    });
    
    const html = response.data;
    const ogTitle = html.match(/property="og:title" content="(.*?)"/)?.[1];
    const ogDescription = html.match(/property="og:description" content="(.*?)"/)?.[1];
    const ogImage = html.match(/property="og:image" content="(.*?)"/)?.[1];

    if (ogTitle) {
      console.log('SUCCESS!');
      console.log('Title:', ogTitle);
      console.log('Description:', ogDescription);
      console.log('Image:', ogImage);
    } else {
      console.log('FAILED: No meta tags found.');
      // Print first 500 chars of body to see what we got
      console.log('Body Start:', html.substring(0, 500));
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testSocialUA('https://www.instagram.com/reel/DS4w7UOkgIW/');
