// naver-folder.ts
import axios from 'axios';
import { FolderApiResponse, FolderResult, Bookmark } from './types';
import { sb } from './database';

export async function fetchFolderBookmarks(shareId: string): Promise<FolderResult> {
  const url = `https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/${shareId}/bookmarks?start=0&limit=5000&sort=lastUseTime&createIdNo=false`;
  console.log('폴더 API 호출:', url);
  
  const response = await axios.get(url, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  
  return {
    data: response.data as FolderApiResponse,
    url: url
  };
}

export async function classifyBookmarks(
  places: Bookmark[], 
  folderId: number
): Promise<{ alreadyInPlace: Bookmark[], needCrawl: Bookmark[] }> {
  const sids = places.map((p) => p.sid);
  if (sids.length === 0) return { alreadyInPlace: [], needCrawl: [] };

  try {
    // a. tbl_naver_folder 에 존재하는 항목 먼저 제외
    const { data: existingInFolder, error: folderError } = await sb
      .from('tbl_naver_folder')
      .select('place_id')
      .eq('id', folderId)
      .in('place_id', sids);

    if (folderError) {
      console.error('폴더 조회 오류:', folderError);
      throw folderError;
    }

    const folderSet = new Set(existingInFolder?.map(r => String(r.place_id)) || []);
    const notInFolder = places.filter((p) => !folderSet.has(p.sid));

    if (notInFolder.length === 0) {
      return { alreadyInPlace: [], needCrawl: [] };
    }

    const notInFolderSids = notInFolder.map((p) => p.sid);

    // b. tbl_place 에 존재 여부 확인
    const { data: existingInPlace, error: placeError } = await sb
      .from('tbl_place')
      .select('id')
      .in('id', notInFolderSids);

    if (placeError) {
      console.error('장소 조회 오류:', placeError);
      throw placeError;
    }

    const placeSet = new Set(existingInPlace?.map(r => String(r.id)) || []);

    const alreadyInPlace = notInFolder.filter((p) => placeSet.has(p.sid));
    const needCrawl = notInFolder.filter((p) => !placeSet.has(p.sid));

    return { alreadyInPlace, needCrawl };
  } catch (error) {
    console.error('북마크 분류 중 오류:', error);
    throw error;
  }
}
