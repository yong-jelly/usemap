// database.ts
import { createClient } from '@supabase/supabase-js';
import { crawlForPlace } from './crawler';
import { DataMapper } from './data-mapper';
import { FolderInfo, Bookmark, BucketData, PlaceData, BookmarkData } from './types';

// Supabase 설정
function getSupabaseConfig() {
  const dbUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    return { url: supabaseUrl, key: supabaseKey };
  }
  
  if (dbUrl) {
    // postgres://postgres.xxx:password@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
    const match = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      const [, user, password, host, port, database] = match;
      const projectIdMatch = host.match(/postgres\.([^.]+)\./);
      if (projectIdMatch) {
        const projectId = projectIdMatch[1];
        return {
          url: `https://${projectId}.supabase.co`,
          key: supabaseKey || 'your-anon-key-here'
        };
      }
    }
  }
  
  throw new Error('SUPABASE_URL과 SUPABASE_ANON_KEY 또는 적절한 DATABASE_URL을 설정해주세요.');
}

const config = getSupabaseConfig();
export const sb = createClient(config.url, config.key);

export async function upsertBucket(details: any[]): Promise<any> {
  const bucketData = DataMapper.toBucketData(details);
  if (bucketData.length === 0) return null;

  const { data, error } = await sb
    .from('tbl_bucket')
    .upsert(bucketData, { 
      onConflict: 'key,name',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Bucket upsert 오류:', error);
    throw error;
  }
  
  return data;
}

export async function upsertPlace(details: any[]): Promise<any> {
  const placeData = DataMapper.toPlaceData(details);
  if (placeData.length === 0) return null;

  const { data, error } = await sb
    .from('tbl_place')
    .upsert(placeData, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Place upsert 오류:', error);
    throw error;
  }
  
  return data;
}

export async function upsertBookmarks(
  folder: FolderInfo, 
  places: Bookmark[], 
  url: string
): Promise<any> {
  const bookmarkData = DataMapper.toBookmarkData(folder, places, url);
  if (bookmarkData.length === 0) return null;

  const { data, error } = await sb
    .from('tbl_naver_folder')
    .upsert(bookmarkData, { 
      onConflict: 'id,place_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Bookmark upsert 오류:', error);
    throw error;
  }
  
  return data;
}

export async function crawlAndExtractValidIds(placeIds: string[]): Promise<string[]> {
  try {
    const details = await crawlForPlace(placeIds);
    await upsertBucket(details);
    await upsertPlace(details);
    
    return DataMapper.extractValidIds(details);
  } catch (error) {
    console.error('크롤링 중 오류 발생:', error);
    return [];
  }
}

