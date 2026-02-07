export const VOTED_KEYWORD_MAP: Record<string, { label: string; category: string }> = {
  // 맛/품질
  food_good: { label: '음식이 맛있어요', category: '맛/품질' },
  coffee_good: { label: '커피 맛집', category: '맛/품질' },
  dessert_good: { label: '디저트 맛집', category: '맛/품질' },
  bread_good: { label: '빵 맛집', category: '맛/품질' },
  fresh: { label: '신선한 재료', category: '맛/품질' },
  special_menu: { label: '특별한 메뉴', category: '맛/품질' },
  menu_good: { label: '알찬 구성', category: '맛/품질' },
  local_taste: { label: '현지의 맛', category: '맛/품질' },
  taste_healthy: { label: '건강한 맛', category: '맛/품질' },
  meat_good: { label: '고기 질 좋음', category: '맛/품질' },
  less_smell: { label: '잡내 없음', category: '맛/품질' },
  spice_weak: { label: '향신료 약함', category: '맛/품질' },
  drink_good: { label: '음료 맛집', category: '맛/품질' },
  sidedish_good: { label: '반찬 잘 나옴', category: '맛/품질' },
  course_good: { label: '알찬 코스', category: '맛/품질' },
  snack_good: { label: '안주 좋음', category: '맛/품질' },
  saladbar_good: { label: '샐러드바 좋음', category: '맛/품질' },

  // 가격/양
  price_cheap: { label: '가성비 좋음', category: '가격/양' },
  large: { label: '푸짐한 양', category: '가격/양' },
  price_worthy: { label: '값어치 함', category: '가격/양' },

  // 분위기
  interior_cool: { label: '멋진 공간', category: '분위기' },
  view_good: { label: '뷰가 좋음', category: '분위기' },
  photo_good: { label: '사진 잘 나옴', category: '분위기' },
  talk_good: { label: '대화하기 좋음', category: '분위기' },
  cozy: { label: '아늑함', category: '분위기' },
  spacious: { label: '넓은 매장', category: '분위기' },
  music_good: { label: '음악 좋음', category: '분위기' },
  concept_unique: { label: '독특한 컨셉', category: '분위기' },
  atmosphere_calm: { label: '차분한 분위기', category: '분위기' },
  outdoor_good: { label: '멋진 야외', category: '분위기' },
  stay_long: { label: '오래 머물기 좋음', category: '분위기' },
  study_good: { label: '집중하기 좋음', category: '분위기' },

  // 편의/서비스
  kind: { label: '친절함', category: '편의/서비스' },
  store_clean: { label: '청결한 매장', category: '편의/서비스' },
  parking_easy: { label: '편한 주차', category: '편의/서비스' },
  toilet_clean: { label: '깨끗한 화장실', category: '편의/서비스' },
  food_fast: { label: '서빙 빠름', category: '편의/서비스' },
  alcohol_var: { label: '다양한 주류', category: '편의/서비스' },
  ventilation_good: { label: '환기 잘 됨', category: '편의/서비스' },
  staff_cook: { label: '직접 구워줌', category: '편의/서비스' },
  comfy: { label: '편한 좌석', category: '편의/서비스' },

  // 상황/목적
  eat_alone: { label: '혼밥하기 좋음', category: '상황/목적' },
  together: { label: '단체모임 좋음', category: '상황/목적' },
  special_day: { label: '특별한 날', category: '상황/목적' },
  kid_good: { label: '아이 동반 좋음', category: '상황/목적' },
  pet_good: { label: '반려동물 동반', category: '상황/목적' },
  drink_alone: { label: '혼술하기 좋음', category: '상황/목적' },
};

export const KEYWORD_CATEGORY_COLORS: Record<string, string> = {
  '맛/품질': 'bg-orange-500',
  '가격/양': 'bg-yellow-500',
  '분위기': 'bg-blue-500',
  '편의/서비스': 'bg-green-500',
  '상황/목적': 'bg-purple-500',
};
