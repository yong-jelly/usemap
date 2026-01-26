import type { PlaceDetailResponse } from "../types/naver";
import type { PlaceRow, PlaceAnalysisRow } from "../types/db";

export class DataTransformer {
  static toPlaceRow(data: PlaceDetailResponse["placeDetail"]): Partial<PlaceRow> | null {
    if (!data || !data.base) {
      console.warn(`[Transformer] Invalid place data: base is missing`);
      return null;
    }

    const { base, shopWindow, informationTab, paiUpperImage, images } = data;
    const groups = base.address?.split(" ") || [];

    // coordinate가 없는 경우 기본값 처리 또는 null 반환
    if (!base.coordinate) {
      console.warn(`[Transformer] Coordinate missing for place: ${base.id}`);
      return null;
    }

    return {
      id: base.id,
      name: base.name,
      road: base.road || null,
      category: base.category || null,
      category_code: base.categoryCode || null,
      category_code_list: JSON.stringify(base.categoryCodeList || []),
      road_address: base.roadAddress || null,
      payment_info: JSON.stringify(base.paymentInfo || []),
      conveniences: JSON.stringify(base.conveniences || []),
      address: base.address || null,
      group1: groups[0] || null,
      group2: groups[1] || null,
      group3: groups[2] || null,
      phone: base.phone || null,
      visitor_reviews_total: base.visitorReviewsTotal || 0,
      visitor_reviews_score: base.visitorReviewsScore || 0,
      x: base.coordinate.x,
      y: base.coordinate.y,
      homepage: JSON.stringify([
        ...(shopWindow?.homepages?.etc?.map(e => e.url) || []),
        ...(shopWindow?.homepages?.repr ? [shopWindow.homepages.repr.url] : [])
      ]),
      keyword_list: JSON.stringify(informationTab?.keywordList || []),
      images: JSON.stringify(paiUpperImage?.images || []),
      static_map_url: data.staticMapUrl || null,
      themes: JSON.stringify(data.themes || []),
      visitor_review_medias_total: data.visitorReviewMediasTotal || 0,
      visitor_review_stats: JSON.stringify(data.visitorReviewStats || null),
      menus: JSON.stringify(base.menus || []),
      street_panorama: JSON.stringify(base.streetPanorama || null),
      place_images: JSON.stringify(images?.images?.map(img => img.origin) || [])
    };
  }

  static toAnalysisRow(data: PlaceDetailResponse["placeDetail"]): Partial<PlaceAnalysisRow> | null {
    const stats = data?.visitorReviewStats;
    if (!stats || !stats.analysis) {
      return null;
    }

    const analysis = stats.analysis;
    const votedKeyword = analysis.votedKeyword || { totalCount: 0, userCount: 0, details: [] };

    return {
      business_id: stats.id,
      review_avg_rating: stats.review?.avgRating || 0,
      total_reviews: stats.review?.totalCount || 0,
      themes: JSON.stringify(analysis.themes || []),
      menus: JSON.stringify(analysis.menus || []),
      voted: JSON.stringify(votedKeyword.details || []),
      voted_sum_count: votedKeyword.totalCount || 0,
      voted_user_count: votedKeyword.userCount || 0
    };
  }
}
