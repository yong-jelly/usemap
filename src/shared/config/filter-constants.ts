/**
 * 필터 관련 공용 상수
 * ExploreFilterSheet 및 ExplorerPage에서 사용
 */

// 테마 목록
export interface Theme {
  code: string;
  theme_name: string;
  display_name: string;
  emoji: string;
}

export const THEMES: Theme[] = [
  { code: 'food_good', theme_name: '음식맛', display_name: '음식이 맛있어요', emoji: '😋' },
  { code: 'large', theme_name: '음식양', display_name: '양이 많아요', emoji: '🍚' },
  { code: 'special_menu', theme_name: '특별메뉴', display_name: '특별한 메뉴가 있어요', emoji: '✨' },
  { code: 'eat_alone', theme_name: '혼밥', display_name: '혼밥하기 좋아요', emoji: '🧘' },
  { code: 'spacious', theme_name: '넓은매장', display_name: '매장이 넓어요', emoji: '🏢' },
  { code: 'fresh', theme_name: '신선도', display_name: '재료가 신선해요', emoji: '🥬' },
  { code: 'kind', theme_name: '친절', display_name: '친절해요', emoji: '😊' },
  { code: 'price_cheap', theme_name: '가성비', display_name: '가성비가 좋아요', emoji: '💰' },
  { code: 'store_clean', theme_name: '청결', display_name: '매장이 청결해요', emoji: '✨' },
  { code: 'food_fast', theme_name: '빠른 주문', display_name: '음식이 빨리 나와요', emoji: '⚡' },
  { code: 'special_day', theme_name: '특별함', display_name: '특별한 날 가기 좋아요', emoji: '🎉' },
  { code: 'toilet_clean', theme_name: '깨끗 화장실', display_name: '화장실이 깨끗해요', emoji: '🧼' },
  { code: 'together', theme_name: '단체모임', display_name: '단체모임 하기 좋아요', emoji: '👥' },
  { code: 'interior_cool', theme_name: '인테리어', display_name: '인테리어가 멋져요', emoji: '🛋️' },
  { code: 'taste_healthy', theme_name: '건강한 맛', display_name: '건강한 맛이에요', emoji: '🥗' },
  { code: 'view_good', theme_name: '굳 뷰', display_name: '뷰가 좋아요', emoji: '🖼️' },
  { code: 'parking_easy', theme_name: '주차편리', display_name: '주차하기 편해요', emoji: '🚗' },
  { code: 'price_worthy', theme_name: '비싼가치', display_name: '비싼 만큼 가치있어요', emoji: '💎' },
  { code: 'menu_good', theme_name: '알찬구성', display_name: '메뉴 구성이 알차요', emoji: '🍱' },
  { code: 'kid_good', theme_name: '아이와 함께', display_name: '아이와 가기 좋아요', emoji: '👶' },
  { code: 'concept_unique', theme_name: '독특 컨셉', display_name: '컨셉이 독특해요', emoji: '🌈' },
  { code: 'local_taste', theme_name: '현지맛', display_name: '현지 맛에 가까워요', emoji: '🌏' },
  { code: 'atmosphere_calm', theme_name: '분위기', display_name: '차분한 분위기에요', emoji: '🕯️' },
  { code: 'drink_alone', theme_name: '굳 혼술', display_name: '혼술하기 좋아요', emoji: '🍺' },
  { code: 'comfy', theme_name: '편한 좌석', display_name: '좌석이 편해요', emoji: '🛋️' },
  { code: 'pet_good', theme_name: '반려동물', display_name: '반려동물과 가기 좋아요', emoji: '🐾' }
];

// 테마 코드 -> 한글 이름 변환 맵
export const THEME_CODE_TO_NAME: Record<string, string> = THEMES.reduce((acc, theme) => {
  acc[theme.code] = theme.theme_name;
  return acc;
}, {} as Record<string, string>);

// 테마 코드를 한글 이름으로 변환하는 함수
export const getThemeNameByCode = (code: string): string => {
  return THEME_CODE_TO_NAME[code] || code;
};

// 카테고리 목록
export interface Category {
  name: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { name: '한식', emoji: '🍚' },
  { name: '카페,디저트', emoji: '🍰' },
  { name: '카페', emoji: '☕' },
  { name: '치킨,닭강정', emoji: '🍗' },
  { name: '육류,고기요리', emoji: '🥩' },
  { name: '중식당', emoji: '🥢' },
  { name: '맥주,호프', emoji: '🍺' },
  { name: '생선회', emoji: '🐟' },
  { name: '베이커리', emoji: '🍞' },
  { name: '종합분식', emoji: '🍢' },
  { name: '요리주점', emoji: '🏮' },
  { name: '돼지고기구이', emoji: '🥓' },
  { name: '족발,보쌈', emoji: '🍖' },
  { name: '피자', emoji: '🍕' },
  { name: '일식당', emoji: '🍣' },
  { name: '포장마차', emoji: '⛺' },
  { name: '분식', emoji: '🍤' },
  { name: '칼국수,만두', emoji: '🥟' },
  { name: '국밥', emoji: '🍲' },
  { name: '곱창,막창,양', emoji: '🔥' },
  { name: '돈가스', emoji: '🍛' },
  { name: '해물,생선요리', emoji: '🦐' },
  { name: '양식', emoji: '🍝' },
  { name: '햄버거', emoji: '🍔' },
  { name: '김밥', emoji: '🍙' },
  { name: '국수', emoji: '🍜' },
  { name: '순대,순댓국', emoji: '🥣' },
  { name: '찌개,전골', emoji: '🥘' },
  { name: '이자카야', emoji: '🍶' },
  { name: '바(BAR)', emoji: '🍸' },
  { name: '소고기구이', emoji: '🐮' },
  { name: '장어,먹장어요리', emoji: '🐍' },
  { name: '오리요리', emoji: '🦆' },
  { name: '한식뷔페', emoji: '🍽️' },
  { name: '감자탕', emoji: '🦴' },
  { name: '초밥,롤', emoji: '🍣' },
  { name: '아귀찜,해물찜', emoji: '🌶️' },
  { name: '유흥주점', emoji: '💃' },
  { name: '야식', emoji: '🌙' },
  { name: '해장국', emoji: '🥄' }
];

// 가격대 목록
export interface PriceRange {
  label: string;
  min: number | null;
  max: number | null;
}

export const PRICE_RANGES: PriceRange[] = [
  { label: "전체", min: null, max: null },
  { label: "1만원 이하", min: null, max: 10000 },
  { label: "1~2만원", min: 10000, max: 20000 },
  { label: "2~3만원", min: 20000, max: 30000 },
  { label: "3~5만원", min: 30000, max: 50000 },
  { label: "5~10만원", min: 50000, max: 100000 },
  { label: "10만원 이상", min: 100000, max: null },
];

// 가격 min/max로 라벨 찾기
export const getPriceLabel = (min: number | null, max: number | null): string | null => {
  if (min === null && max === null) return null;
  const found = PRICE_RANGES.find(r => r.min === min && r.max === max);
  return found?.label || null;
};

// 지역 데이터
export interface RegionData {
  group1: string;
  group2_json: string[];
}

export const REGION_DATA: RegionData[] = [
  { group1: '서울', group2_json: ['전체','강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'] },
  { group1: '경기', group2_json: ['전체','가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'] },
  { group1: '인천', group2_json: ['전체','강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'] },
  { group1: '강원', group2_json: ['전체','강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'] },
  { group1: '충북', group2_json: ['전체','괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'] },
  { group1: '충남', group2_json: ['전체','계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'] },
  { group1: '대전', group2_json: ['전체','대덕구', '동구', '서구', '유성구', '중구'] },
  { group1: '세종', group2_json: ['전체','가람동', '고운동', '금남면', '나성동', '다정동', '대평동', '도담동', '반곡동', '보람동', '부강면', '산울동', '새롬동', '세종동', '소담동', '소정면', '아름동', '어진동', '연기면', '연동면', '연서면', '원리', '장군면', '전동면', '전의면', '조치원읍', '종촌동', '집현동', '한솔동', '해밀동'] },
  { group1: '전북', group2_json: ['전체','고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '읍시', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'] },
  { group1: '전남', group2_json: ['전체','강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'] },
  { group1: '광주', group2_json: ['전체','광산구', '남구', '동구', '북구', '서구'] },
  { group1: '경북', group2_json: ['전체','경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'] },
  { group1: '경남', group2_json: ['전체','거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'] },
  { group1: '부산', group2_json: ['전체','강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'] },
  { group1: '대구', group2_json: ['전체','군위군', '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'] },
  { group1: '울산', group2_json: ['전체','남구', '동구', '북구', '울주군', '중구'] },
  { group1: '제주', group2_json: ['전체','서귀포시', '제주시'] }
];
