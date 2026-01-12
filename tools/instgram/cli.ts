import { chromium } from 'playwright';

/**
 * 인스타그램 릴스 링크를 분석하여 메타 정보를 JSON으로 반환합니다.
 * 
 * 실행 방법:
 * bun tools/instgram/cli.ts "https://www.instagram.com/reel/DS4w7UOkgIW/"
 */

async function analyzeReel(url: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    const metaData = await page.evaluate(() => {
      const getMeta = (name: string) => {
        const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
        return el ? el.getAttribute('content') : null;
      };

      const title = getMeta('og:title');
      const description = getMeta('og:description');
      const imageUrl = getMeta('og:image');
      const videoUrl = getMeta('og:video') || getMeta('og:video:secure_url');
      
      // 작성자 정보 추출
      let authorHandle = 'unknown';
      if (description) {
        const authorMatch = description.match(/ - (.*?) - /);
        if (authorMatch) authorHandle = authorMatch[1];
      }
      
      // DOM에서 다시 확인
      const authorLink = document.querySelector('a[href^="/"][href$="/"]')?.getAttribute('href');
      if (authorHandle === 'unknown' && authorLink) {
        authorHandle = authorLink.replace(/\//g, '');
      }
      
      // 해시태그 추출
      const hashtags = Array.from(document.querySelectorAll('a[href*="/explore/tags/"]'))
        .map(a => (a as HTMLElement).innerText);

      // 업로드 날짜 (Time tag)
      const timeEl = document.querySelector('time');
      const uploadDate = timeEl ? timeEl.getAttribute('datetime') : null;

      // 좋아요, 댓글 수 (문자열 파싱이 필요할 수 있음)
      // og:description에 보통 "194 likes, 14 comments..." 식으로 포함됨
      let likes = 0;
      let comments = 0;
      if (description) {
        const likesMatch = description.match(/(\d+)\s+likes/);
        const commentsMatch = description.match(/(\d+)\s+comments/);
        if (likesMatch) likes = parseInt(likesMatch[1]);
        if (commentsMatch) comments = parseInt(commentsMatch[1]);
      }

      return {
        url: window.location.href,
        title,
        caption: description?.split(' - ')[2]?.replace(/^"|"$/g, '') || description,
        author: {
          username: authorHandle,
          url: `https://www.instagram.com/${authorHandle}/`
        },
        uploadDate,
        thumbnailUrl: imageUrl,
        videoUrl,
        hashtags,
        stats: {
          likes,
          comments
        }
      };
    });

    console.log(JSON.stringify(metaData, null, 2));
  } catch (error) {
    console.error('Error analyzing reel:', error);
  } finally {
    await browser.close();
  }
}

const url = process.argv[2];
if (!url) {
  console.error('Please provide an Instagram Reel URL');
  process.exit(1);
}

analyzeReel(url);
