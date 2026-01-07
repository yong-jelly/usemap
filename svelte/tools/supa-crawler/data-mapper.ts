// data-mapper.ts
import { PlaceDetail, BucketData, PlaceData, BookmarkData, FolderInfo, Bookmark } from './types';

export class DataMapper {
  static toBucketData(details: PlaceDetail[]): BucketData[] {
    return details
      .map(item => {
        const isError = item.error && item.place_id;
        const placeId = isError ? item.place_id : item.base?.id;
        if (!placeId) return null;

        const name = isError ? `${placeId}-error` : `${placeId}`;
        const value = isError 
          ? String(item.error) 
          : `${item.base?.name ?? ''} ${item.base?.address ?? ''}`.trim();
        
        return {
          key: 'upsert_place_from_cli',
          name,
          value,
          updated_at: new Date().toISOString()
        };
      })
      .filter((item): item is BucketData => item !== null);
  }

  static toPlaceData(details: PlaceDetail[]): PlaceData[] {
    return details
      .filter(item => !item.error && item.base)
      .map(item => {
        const base = item.base!;
        console.log(base.id, base.name, '처리중...');
        
        return {
          id: base.id,
          name: base.name || null,
          road: base.road || null,
          category: base.category || null,
          category_code: base.categoryCode || null,
          category_code_list: base.categoryCodeList || null,
          road_address: base.roadAddress || null,
          payment_info: Array.isArray(base.paymentInfo) ? base.paymentInfo : 
                       (base.paymentInfo ? [base.paymentInfo] : null),
          conveniences: base.conveniences || null,
          address: base.address || null,
          phone: base.phone || null,
          visitor_reviews_total: base.visitorReviewsTotal || 0,
          visitor_reviews_score: base.visitorReviewsScore || 0,
          x: base.coordinate?.x || null,
          y: base.coordinate?.y || null,
          homepage: base.homepage || null,
          keyword_list: base.keyword_list || null,
          images: base.images || null,
          static_map_url: base.static_map_url || null,
          themes: base.themes || null,
          visitor_review_medias_total: base.visitor_review_medias_total || 0,
          visitor_review_stats: base.visitor_review_stats || null,
          menus: base.menus || null,
          street_panorama: base.streetPanorama || null,
          place_images: base.place_images || null,
          group1: base.group1 || null,
          group2: base.group2 || null,
          group3: base.group3 || null,
          updated_at: new Date().toISOString()
        };
      });
  }

  static toBookmarkData(folder: FolderInfo, places: Bookmark[], url: string): BookmarkData[] {
    return places.map(bm => ({
      id: folder.folderId,
      name: folder.name,
      memo: folder.memo || null,
      last_use_time: folder.lastUseTime ? new Date(folder.lastUseTime).toISOString() : null,
      creation_time: folder.creationTime ? new Date(folder.creationTime).toISOString() : null,
      place_id: bm.sid,
      url: url,
      updated_at: new Date().toISOString()
    }));
  }

  static extractValidIds(details: PlaceDetail[]): string[] {
    const excludedCodes = ["227616", "227755", "227813", "227815"];
    
    return details
      .filter(item => !item.error && item.base)
      .filter(item => {
        const categoryCodeList = item.base!.categoryCodeList;
        if (!categoryCodeList || !Array.isArray(categoryCodeList)) return true;
        return !categoryCodeList.some(code => excludedCodes.includes(code));
      })
      .map(item => item.base!.id);
  }
}
