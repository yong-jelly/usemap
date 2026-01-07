// bun i @supabase/supabase-js axios --no-save
// export DATABASE_URL=postgres://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cXBnZ3BpbGdjZHNhd3V2cHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDExMDYyNiwiZXhwIjoyMDU5Njg2NjI2fQ.LvWd_GL6yPDHwAHAwgRgoKcSKYzpopAQ3snpV7mffj4
// export SUPABASE_URL=https://xyqpggpilgcdsawuvpzn.supabase.co
// export SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cXBnZ3BpbGdjZHNhd3V2cHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMTA2MjYsImV4cCI6MjA1OTY4NjYyNn0.JbFl5dmVd3yPw6mnvvakn9T43_zbsTsJqhEK6D8qbtM
import { crawlForPlace } from './crawler';
import { writeFileSync } from 'fs';
// @ts-ignore – No type definitions for postgres when not installed locally
import postgres from 'postgres';

const args = process.argv.slice(2);
console.log(args);

if (args.length === 0) {
	console.log('사용법: bun run cli.ts <placeId1> <placeId2> ...');
	// console.log("사용법: bun run cli.ts 1732989163 2017243702");
	process.exit(1);
}

const sql = process.env.DATABASE_URL
	? postgres(process.env.DATABASE_URL)
	: postgres({
			host: process.env.PGHOST || 'localhost',
			port: +(process.env.PGPORT || 5432),
			user: process.env.PGUSER || 'postgres',
			password: process.env.PGPASSWORD || '',
			database: process.env.PGDATABASE || 'postgres',
		});

// array helper – convert undefined/null to null, else postgres array
const arr = (value: any[] | string | null | undefined) => {
	if (!value) return null;
	if (Array.isArray(value)) return sql.array(value);
	// 단일 문자열일 경우 배열로 변환
	return sql.array([value]);
};

async function upsertBucket(details: any[], sqlInstance?: any) {
	const key = 'upsert_place_from_cli';
	for (const item of details) {
		const isError = item.error && item.place_id;
		const placeId = isError ? item.place_id : item.id;
		if (!placeId) continue;

		const name = isError ? `${placeId}-error` : `${placeId}`;
		const value = isError ? String(item.error) : `${item.name ?? ''} ${item.address ?? ''}`.trim();
		const sql2 = sqlInstance ? sqlInstance : sql;
		await sql2`
            INSERT INTO public.tbl_bucket (key, name, value)
            VALUES (${key}, ${name}, ${value})
            ON CONFLICT (key, name) DO UPDATE
            SET updated_at = NOW()
            returning *;
        `;
	}
}

async function upsertPlace(details: any[], sqlInstance?: any) {
	const placeIds = details.map((item) => item.id);
	for (const item of details) {
		if (item.error) continue; // 오류 케이스는 건너뜀
		// console.log(item);
		console.log(item.id, item.name, '처리중...');
		const sql2 = sqlInstance ? sqlInstance : sql;
		await sql2`
        INSERT INTO public.tbl_place (
            id, name, road, category, category_code, category_code_list,
            road_address, payment_info, conveniences, address, phone,
            visitor_reviews_total, visitor_reviews_score, x, y, homepage,
            keyword_list, images, static_map_url, themes,
            visitor_review_medias_total, visitor_review_stats, menus,
            street_panorama, place_images, group1, group2, group3
        ) VALUES (
            ${item.id}, ${item.name ?? null}, ${item.road ?? null}, ${item.category ?? null},
            ${item.category_code ?? null}, ${arr(item.category_code_list)},
            ${item.road_address ?? null}, ${arr(item.payment_info)}, ${arr(item.conveniences)},
            ${item.address ?? null}, ${item.phone ?? null},
            ${item.visitor_reviews_total ?? 0}, ${item.visitor_reviews_score ?? 0},
            ${item.x ?? null}, ${item.y ?? null}, ${arr(item.homepage)},
            ${arr(item.keyword_list)}, ${arr(item.images)}, ${item.static_map_url ?? null},
            ${arr(item.themes)}, ${item.visitor_review_medias_total ?? 0},
            ${item.visitor_review_stats ?? null}::jsonb,
            ${item.menus ?? null}::jsonb,
            ${item.street_panorama ?? null}::jsonb,
            ${arr(item.place_images)}, ${item.group1 ?? null}, ${item.group2 ?? null}, ${item.group3 ?? null}
        )
        ON CONFLICT (id) DO UPDATE
            SET updated_at = NOW();
        `;
	}
}

crawlForPlace(args)
	.then(async (details) => {
		// console.log(details);
		await upsertBucket(details);
		await upsertPlace(details);
		await sql.end();
		console.log('처리완료');
		// writeFileSync("./result.json", JSON.stringify(details, null, 2), { encoding: "utf8" });
	})
	.catch(console.error);

export async function crawlAndExtractValidIds(
	placeIds: string[],
	sqlInstance?: any,
): Promise<string[]> {
	try {
		const details = await crawlForPlace(placeIds);
		// console.log(details);
		const bucket = await upsertBucket(details, sqlInstance);
		const place = await upsertPlace(details, sqlInstance);
		console.log(bucket, place);
		// error 메시지가 있는 항목 제외하고 유효한 id만 배열로 반환
		const validIds = details
			.filter((item) => !item.error)
			.filter((item) => {
				const excludedCodes = ['227616', '227755', '227813', '227815'];
				return !item.base?.categoryCodeList?.some((code) => excludedCodes.includes(code));
			})
			.map((item) => item.id);

		return validIds;
	} catch (error) {
		console.error('크롤링 중 오류 발생:', error);
		return [];
	}
}
