/**
 * 네이버 MY플레이스 리뷰(Review) 크롤러 CLI
 * 
 * 사용법: bun run tools/cli/review.ts <userId>
 */

import { sql } from '../shared/db';
import { apiClient } from '../shared/api';
import { sleep } from '../shared/utils';

const GRAPHQL_URL = 'https://porta.place.naver.com/graphql';

/**
 * 사용자의 공개 프로필에서 내부 ID(userIdno) 추출
 */
async function getUserIdno(userId: string): Promise<string> {
    const url = `https://m.place.naver.com/my/${userId}/review`;
    const response = await apiClient.get(url);
    
    const match = response.data.match(/\"idno\":\"([^\"]+)\"/);
    if (match) return match[1];

    // __NEXT_DATA__에서 시도
    const nextDataMatch = response.data.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">(.*?)<\/script>/);
    if (nextDataMatch) {
        const nextData = JSON.parse(nextDataMatch[1]);
        const state = nextData.props.pageProps.initialState;
        const userKey = Object.keys(state).find(k => k.startsWith('User:'));
        if (userKey) return state[userKey].idno;
    }
    
    throw new Error('userIdno를 찾을 수 없습니다. 공개 프로필인지 확인해주세요.');
}

/**
 * 사용자 메타데이터 조회
 */
async function getUserMetadata(userId: string) {
    const url = `https://m.place.naver.com/my/${userId}/review`;
    const response = await apiClient.get(url);
    const nextDataMatch = response.data.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">(.*?)<\/script>/);
    if (!nextDataMatch) throw new Error('메타데이터 파싱 실패');

    const state = JSON.parse(nextDataMatch[1]).props.pageProps.initialState;
    const userKey = Object.keys(state).find(k => k.startsWith('User:'));
    const user = userKey ? state[userKey] : null;

    return {
        nickname: user?.profile?.nickname || '알 수 없음',
        totalCount: user?.stat?.reviewCount || 0
    };
}

/**
 * 리뷰 목록 페이징 조회
 */
async function fetchReviews(userIdno: string, after?: string) {
    const query = `
    query UserReviewGroups($input: UserReviewGroupsInput!, $connection: UserReviewGroupsConnectionInput!) {
      userReviewGroups(input: $input, connection: $connection) {
        ... on UserReviewGroupsConnection {
          edges { id placeSummary { id name } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }`;

    const variables = {
        input: { sort: "VISIT_DATE_TIME_DESC", userIdno },
        connection: { after, first: 50 }
    };

    const response = await apiClient.post(GRAPHQL_URL, {
        operationName: 'UserReviewGroups',
        variables,
        query
    }, {
        headers: { 'Referer': 'https://m.place.naver.com/my/' }
    });

    return response.data.data.userReviewGroups;
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('사용법: bun run tools/cli/review.ts <userId>');
        process.exit(1);
    }

    const userId = args[0];

    try {
        console.log(`[리뷰] 사용자 정보 조회 중... (${userId})`);
        const meta = await getUserMetadata(userId);
        const userIdno = await getUserIdno(userId);

        console.log(`-----------------------------------------`);
        console.log(`닉네임: ${meta.nickname} (${userIdno})`);
        console.log(`총 리뷰: ${meta.totalCount}개`);
        console.log(`-----------------------------------------`);

        let hasNextPage = true;
        let endCursor: string | undefined = undefined;
        let count = 0;

        while (hasNextPage) {
            const connection = await fetchReviews(userIdno, endCursor);
            if (!connection?.edges) break;

            for (const edge of connection.edges) {
                const place = edge.placeSummary;
                if (place) {
                    count++;
                    console.log(`[${count.toString().padStart(4, ' ')}] ID: ${place.id.padEnd(12, ' ')} | 이름: ${place.name}`);
                }
            }

            hasNextPage = connection.pageInfo.hasNextPage;
            endCursor = connection.pageInfo.endCursor;
            if (hasNextPage) await sleep(500);
        }

        console.log(`\n✅ 총 ${count}개의 장소 목록을 추출했습니다.`);

    } catch (err: any) {
        console.error('❌ 오류 발생:', err.message);
    } finally {
        await sql.end();
    }
}

main();
