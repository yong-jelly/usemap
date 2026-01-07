// 커뮤니티 URL에서 메타 정보 추출
/**
 * 커뮤니티 URL에서 메타 정보를 추출하는 인터페이스
 */
export interface CommunityMetaInfo {
  /** 도메인 (예: naver, youtube 등) */
  domain: string;
  /** 페이지/콘텐츠 제목 */
  title: string;
  /** 페이지/콘텐츠 설명 */
  description: string;
  /** 원본 URL */
  url: string;
}


// 내 위치 모델 타입 정의
export interface MyLocationModel {
  status: 'loading' | 'success' | 'error';
  address: string | null;
  detail?: {
    adm?: string | null;
    legal?: string | null;
    latitude: number;
    longitude: number;
  };
  error?: string;
}

export interface ApiConfig {
	baseURL: string;
	headers: {
		'Content-Type': string;
		[key: string]: string;
	};
	timeout?: number;
}

export interface ApiResponse<T = any> {
	meta: any;
	result: T;
	epoch?: number;
}

export interface ApiError extends Error {
	status?: number;
	response?: ApiResponse;
}

export interface UserProfile {
  auth_user_id: string;
  public_profile_id: string;
  nickname: string;
  bio: string | null;
  profile_image_url: string | null;
  gender_code: 'M' | 'F' | null;
  age_group_code: '10s' | '20s' | '30s' | '40s' | '50s+' | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewItemForDetail {
  id: string;
  body: string;
  media: {
    type: string;
    video_id: string | null;
    thumbnail: string;
    video_url: string | null;
    thumbnail_ratio: string;
  }[];
  rating: number | null;
  created: string | null;
  visited: string;
  author_id: string;
  author_url: string;
  view_count: number;
  author_from: string;
  visit_count: number;
  author_nickname: string;
  author_object_id: string;
}

export interface ReviewItem2 {
  id: string;
  business_id: string;
  business_name: string;
  address: string;
  category: string;
  group1: string;
  group2: string;
  group3: string;
  author_id: string;
  author_nickname: string;
  body: string;
  media: {
    type: string;
    video_id: string | null;
    thumbnail: string;
    video_url: string | null;
    thumbnail_ratio: string;
  }[];
  visit_count: number;
  visited: string;
  created: string;
  view_count: number;
  final_pop_score: number;
  visitor_reviews_total: number;
  x: string;
  y: string;
}

// ReviewItem 인터페이스
export interface ReviewItem {
	id: string;
	business_id: string;
	business_name: string;
	address: string;
	category: string;
	group1: string;
	group2: string;
	group3: string;
	visitor_reviews_score: number | null;
	visitor_reviews_total: number;
	author_nickname: string;
	body: string;
	media: string[];
	visit_count: number;
	visited: string;
	created: string;
	view_count: number;
	base_popularity_score: number;
	days_since_creation: number;
	final_popularity_score: number;
	rating: number | null; // ReviewCard 컴포넌트와 호환되도록 수정
	review_id?: string; // 일부 쿼리에서 사용됨
	quality_score?: number; // 단골 쿼리에서 사용됨
	regular_customer_score?: number; // 단골 쿼리에서 사용됨
	parsed_date?: string; // 단골 쿼리에서 사용됨
	season_relevance_score?: number; // 시즌 쿼리에서 사용됨
}

export interface PlaceComment {
	id: string;
	title: string | null;
	content: string;
  place_id: string;
	user_id: string;
	created_at: string;
	updated_at: string;
	image_paths: string[] | null;
	user_profile: SimpleUserProfile;
	comment_level: number;
	parent_comment_id: string | null;
}
export interface Analysis {
  menus: {
    code: string;
    count: number;
    label: string;
  }[];
  voted: {
    code: string;
    count: number;
    iconUrl: string;
    category: string | null;
    iconCode: string;
    displayName: string;
    previousRank: number | null;
  }[];
  themes: {
    code: string;
    count: number;
    label: string;
  }[];
  total_reviews: number;
  voted_sum_count: number;
  voted_user_count: number;
  review_avg_rating: number;
}

export interface PlaceDetail {
	tags: string[];
	comments: PlaceComment[];
	reviews: ReviewItemForDetail[];
	analysis: Analysis;
	is_liked: boolean;
	is_saved: boolean;
	is_commented: boolean;
	is_place_tagged: boolean;
	place_tag_count: number;
	place_liked_count: number;
	place_saved_count: number;
	place_comment_count: number;
	place_review_liked_count: number;
	place_review_saved_count: number;
}

export interface Menu {
  id: string;
  name: string;
  index: number;
  price: string; // 단일 가격 또는 "89000~149000" 와 같은 범위 가격 형태
  images: string[];
  recommend: boolean;
  description: string;
}

interface VisitorReviewMenuItem {
  code: string;
  count: number;
  label: string;
}

interface VisitorReviewThemeItem {
  code: string;
  count: number;
  label: string;
}

interface VotedKeywordDetail {
  code: string;
  count: number;
  iconUrl: string;
  iconCode: string;
  displayName: string;
  category?: string | null;
  previousRank?: number | null;
}

interface VotedKeyword {
  details: VotedKeywordDetail[];
  userCount: number;
  totalCount: number;
  reviewCount: number;
}

interface VisitorReviewAnalysis {
  menus: VisitorReviewMenuItem[];
  themes: VisitorReviewThemeItem[];
  votedKeyword: VotedKeyword;
}

interface VisitorReviewStats {
  id: number;
  review: {
    avgRating: number;
    totalCount: number;
  };
  analysis: VisitorReviewAnalysis;
}

interface StreetPanorama {
  id: string;
  fov: string;
  lat: string;
  lon: string;
  pan: string;
  tilt: string;
}

interface PlaceInteraction {
  tags: string[];
  comments: PlaceComment[];
  is_liked: boolean;
  is_saved: boolean;
  is_commented: boolean;
  is_place_tagged: boolean;
  place_tag_count: number;
  place_liked_count: number;
  place_saved_count: number;
  place_comment_count: number;
  place_review_liked_count: number;
  place_review_saved_count: number;
}

/**
 * 장소 피처의 사용자 프로필 정보
 */
export interface FeatureUserProfile {
	nickname: string;
	profile_image_url: string | null;
}

export interface SimpleUserProfile {
	nickname: string;
	profile_image_url: string | null;
}

/**
 * 장소 피처 정보
 */
export interface Feature {
	id: string;
	title: string | null;
	status: string;
	user_id: string;
	metadata: YouTubeVideoSnippet | CommunityMetaInfo | null;
	created_at: string;
	updated_at: string;
	content_url: string;
	is_features: boolean;
	is_verified: boolean;
	published_at: string;
	user_profile: FeatureUserProfile;
	platform_type: 'youtube' | 'community' | 'folder';
}

// 음식점 관련 타입들
export interface Place {
	x: string;
	y: string;
	id: string;
	name: string;
	road: string | null;
	menus: Menu[];
	phone: string;
	group1: string;
	group2: string;
	group3: string;
	images: string[];
	themes: string[] | null; // 예시 데이터에서는 null 이지만, 다른 경우 배열일 수 있음
	address: string;
	category: string;
	homepage: string[];
	created_at: string;
	image_urls: string[];
	updated_at: string;
	conveniences: string[];
	keyword_list: string[];
	payment_info: string | null; // 타입 불분명, 우선 string | null 처리
	place_images: string[];
	road_address: string;
	category_code: string;
	static_map_url: string;
	street_panorama: StreetPanorama | null; // null 가능성 있음
	category_code_list: string[];
	visitor_review_stats: VisitorReviewStats | null; // null 가능성 있음
	visitor_reviews_score: number;
	visitor_reviews_total: number;
	visitor_review_medias_total: number;
	interaction?: PlaceInteraction | null; // 사용자 상호작용 정보 추가 (선택적 또는 null 가능)
	liked_by_me?: boolean; // 현재 사용자가 이 장소를 좋아하는지 여부
	features?: Feature[];
	experience?: Experience | null;
  avg_price: number; // 가격대
	naver_folder?: {
    id: string;
    folders:PlaceFolder[]; // 장소가 속한 폴더 목록
  }
}

/**
 * 폴더 정보 (네이버 지도 북마크 폴더)
 */
export interface PlaceFolder {
	url: string; // 폴더 공유 URL
	memo: string; // 폴더 메모
	name: string; // 폴더 이름
	folder_id: number; // 폴더 고유 ID
	created_at: string; // 생성 시간 (ISO 8601)
	updated_at: string; // 수정 시간 (ISO 8601)
	view_count: number; // 조회수
	follow_count: number; // 팔로우 수
	creation_time: string; // 원본 생성 시간 (ISO 8601)
	last_use_time: string; // 마지막 사용 시간 (ISO 8601)
}




/**
 * 투표 항목 정보 (방문자 평가용)
 */
export interface Experience {
  is_visited: boolean;
	// place_id: string;
	// is_visited: boolean;
	// latest_visited_at: string | null;
	// my_visits: number;
	// total_visits: number;
	// unique_users: number;
}


/**
 * 투표 항목 정보 (방문자 평가용)
 */
export interface VoteItem {
	text: string;
	count: number;
	icon_code: string;
}

// --- 추가된 타입 ---

/**
 * 인증된 사용자 정보 (authStore 에서 사용)
 */
export interface AuthUser {
	id: string | null;
	email: string | null;
	name: string | null;
	avatar_url: string | null;
	isAuthenticated: boolean;
	metadata?: Record<string, any>; // Supabase의 user_metadata
}

/**
 * Supabase 댓글 테이블(tbl_comment_for_place) 및 관련 정보 인터페이스
 */
export interface SupabaseComment {
	id: string; // 댓글 고유 ID (PK)
	user_id: string | null; // 작성자 ID (FK, auth.users.id), 탈퇴 시 NULL 가능
	username: string | null; // 작성자 이름 (auth.users.raw_user_meta_data 에서 가져옴)
	avatar_url: string | null; // 작성자 아바타 URL (auth.users.raw_user_meta_data 에서 가져옴)
	title: string | null; // 댓글 제목 (선택적)
	content: string; // 댓글 본문 내용
	business_id: string; // 댓글이 달린 장소(음식점) ID
	image_paths: string[] | null; // 첨부 이미지 경로 배열 (선택적)
	parent_comment_id: string | null; // 부모 댓글 ID (대댓글인 경우)
	comment_level: number; // 댓글 계층 레벨 (0: 원본, 1: 대댓글)
	is_active: boolean; // 댓글 활성 상태 (true: 활성/표시, false: 비활성/숨김)
	created_at: string; // 생성 시각 (ISO 8601 문자열)
	updated_at: string; // 마지막 수정 시각 (ISO 8601 문자열)
	reply_count?: number; // 원본 댓글의 활성 대댓글 수 (v1_get_comments_for_place 에서 반환)
	is_liked?: boolean; // 현재 로그인한 사용자의 이 댓글 좋아요 여부 (UI 상태)
	likes?: number; // 이 댓글의 총 좋아요 수 (UI 상태, 별도 집계 또는 근사치)
	replies?: SupabaseComment[]; // 대댓글 목록 (UI에서 구조화 시 사용)
}

/**
 * 새 댓글 생성을 위한 데이터 구조
 */
export interface CreateCommentData {
	business_id: string;
	content: string;
	title?: string | null;
	image_paths?: string[] | null;
	parent_comment_id?: string | null;
}

/**
 * 기존 댓글 수정을 위한 데이터 구조
 */
export interface UpdateCommentData {
	content: string;
	title?: string | null;
	image_paths?: string[] | null;
}

/**
 * 태그 마스터 테이블 인터페이스
 */
export interface TagMaster {
  id: string;
  tag_group: string;
  tag_group_ko: string;
  tag_name: string;
  tag_name_slug: string;
  tag_order: number;
  tag_desc?: string;
  category: string;
  topic: string;
  level: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/**
 * 사용자가 장소에 추가한 태그 정보 인터페이스
 */
export interface PlaceTag {
  id: string;
  user_id: string;
  business_id: string;
  tag_id: string;
  additional_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// SELECT * FROM public.v1_list_places_by_filters(p_group1 := '대전', p_category := ARRAY['한식', '중식'], p_limit := 20);
	// 필터 상태 인터페이스 정의
  export interface ExplorerFilterState {
    rating: number | null;
    categories: string[] | null;
    features: string[] | null;
    group1: string | null;
    group2: string | null;
    group3: string | null;
    themes: string | null;
    nearMe: boolean| null;
    radius: number| null;
    currentLocation: string | null;
    channels: string[] | null;
}

// types/youtube.ts

/**
 * YouTube 썸네일 이미지 정보
 */
export interface YouTubeThumbnail {
  /** 썸네일 이미지 URL */
  url: string;
  /** 이미지 너비 (픽셀) */
  width: number;
  /** 이미지 높이 (픽셀) */
  height: number;
}

/**
 * YouTube 비디오의 다양한 크기 썸네일 모음
 */
export interface YouTubeThumbnails {
  /** 기본 크기 썸네일 (120x90) */
  default: YouTubeThumbnail;
  /** 중간 크기 썸네일 (320x180) */
  medium: YouTubeThumbnail;
  /** 고화질 썸네일 (480x360) */
  high: YouTubeThumbnail;
  /** 표준 화질 썸네일 (640x480) */
  standard: YouTubeThumbnail;
  /** 최고 해상도 썸네일 (1280x720) */
  maxres: YouTubeThumbnail;
}

/**
 * 지역화된 콘텐츠 정보
 */
export interface YouTubeLocalized {
  /** 지역화된 제목 */
  title: string;
  /** 지역화된 설명 */
  description: string;
}

/**
 * YouTube API에서 반환되는 비디오 스니펫 정보
 */
export interface YouTubeVideoSnippet {
  /** 비디오 게시 날짜 (ISO 8601 형식) */
  publishedAt: string;
  /** 채널 고유 ID */
  channelId: string;
  /** 비디오 제목 */
  title: string;
  /** 비디오 설명 */
  description: string;
  /** 다양한 크기의 썸네일 이미지들 */
  thumbnails: YouTubeThumbnails;
  /** 채널명 */
  channelTitle: string;
  /** 비디오 태그 배열 */
  tags: string[];
  /** 카테고리 ID (24: Entertainment) */
  categoryId: string;
  /** 라이브 방송 상태 ('none', 'live', 'upcoming') */
  liveBroadcastContent: string;
  /** 기본 언어 코드 */
  defaultLanguage: string;
  /** 지역화된 제목과 설명 */
  localized: YouTubeLocalized;
  /** 기본 오디오 언어 코드 */
  defaultAudioLanguage: string;
}


// 추천 집계 데이터
/**
 * 도메인 집계 데이터
 */
export interface DomainAggregation {
  /** 도메인명 */
  domain: string;
  /** 총 개수 */
  total_count: number;
  /** 플랫폼 타입 */
  platform_type: string;
}

/**
 * 지역 집계 데이터
 */
export interface RegionAggregation {
  /** 지역 그룹 1 (시/도) */
  group1: string;
  /** 장소 개수 */
  place_count: number;
}

/**
 * 카테고리 집계 데이터
 */
export interface CategoryAggregation {
  /** 카테고리명 */
  category: string;
  /** 장소 개수 */
  place_count: number;
}

/**
 * 전체 집계 데이터
 */
export interface TotalAggregation {
  /** 총 행 개수 */
  total_row_count: number;
  /** 총 사용자 수 */
  total_user_count: number;
  /** 총 장소 수 */
  total_place_count: number;
}

/**
 * 전체 통계 데이터
 */
export interface AllStats {
  /** 총 행 개수 */
  total_row_count: number;
  /** 총 사용자 수 */
  total_user_count: number;
  /** 총 장소 수 */
  total_place_count: number;
  /** 도메인별 집계 */
  domain_aggregation: DomainAggregation[];
  /** 지역별 집계 */
  region_aggregation: RegionAggregation[];
  /** 카테고리별 집계 */
  category_aggregation: CategoryAggregation[];
}

/**
 * 그룹별 통계 데이터
 */
export interface GroupStats {
  /** 도메인명 */
  domain: string;
  /** 장소 개수 */
  total_place_count: number;
  total_row_count: number;
  total_user_count: number;
  /** 플랫폼 타입 */
  platform_type: string;
  /** 전체 집계 데이터 */
  // total_aggregation: TotalAggregation;
  /** 지역별 집계 */
  region_aggregation: RegionAggregation[];
  /** 카테고리별 집계 */
  category_aggregation: CategoryAggregation[];
}

/**
 * 추천 집계 데이터 전체 구조
 */
export interface RecommendationStatsData {
  /** 전체 통계 */
  all_stats: AllStats;
  /** 그룹별 통계 배열 */
  group_stats: GroupStats[];
}

/**
 * 추천 집계 버킷 데이터
 */
export interface RecommendationStatsBucket<T = RecommendationStatsData> {
  /** 버킷 키 */
  bucket_key: string;
  /** 버킷 이름 */
  bucket_name: string;
  /** 추천 집계 데이터 (JSONB) */
  bucket_data_jsonb: T;
  /** 생성 날짜 (ISO 8601 형식) */
  bucket_created_at: string;
  // 데이터 갱신된 시간(초)
  elapsed_seconds: number;
}
/**
 * 사용자별 장소 지역 통계 데이터
 */
export interface UserPlaceRegionStats {
  /** 전체 개수 */
  all: number;
  /** 좋아요 개수 */
  liked: number;
  /** 저장 개수 */
  saved: number;
  /** 방문 개수 */
  visited: number;
  /** 집계 그룹 (지역명) */
  agg_group: string;
}

/**
 * 사용자별 장소 카테고리 통계 데이터
 */
export interface UserPlaceCategorizedStats {
  /** 전체 개수 */
  all: number;
  /** 좋아요 개수 */
  liked: number;
  /** 저장 개수 */
  saved: number;
  /** 방문 개수 */
  visited: number;
  /** 집계 그룹 (카테고리명) */
  agg_group: string;
}

/**
 * 사용자별 장소 통계 결합 데이터
 */
export interface UserPlacesStatsData {
  /** 지역별 통계 배열 */
  v1_aggr_user_places_region_stats: UserPlaceRegionStats[];
  /** 카테고리별 통계 배열 */
  v1_aggr_user_places_categorized_stats: UserPlaceCategorizedStats[];
  // 콘텐츠 영상 소개된 음식점 수
  total_features_count: number;
  // 좋아요한 장소 방문 수
  total_liked_places_visited: number;
  // 저장한 장소 방문 수
  total_saved_places_visited: number;
  // 방문한 장소 좋아요 수
  total_visited_places_liked: number;
  // 방문한 장소 저장 수
  total_visited_places_saved: number;
  // 추천 장소 수 중 방문한 장소 수
  total_featured_place_visited: number;
}

/**
 * 리뷰 태그 분석 데이터
 */
export interface ReviewTagAnalysis {
  /** 태그 개수 */
  count: number;
  /** 태그 코드 */
  tag_code: string;
  /** 전체 리뷰 대비 비율 (%) */
  percentage: number;
}

/**
 * 최근 리뷰 데이터
 */
export interface RecentReview {
  /** 태그 배열 */
  tags: string[];
  /** 카테고리 */
  category: string;
  /** 위치 */
  // location: string;
  /** 장소명 */
  place_name: string;
  /** 작성일 */
  created_date: string;
  /** 공개 상태 */
  // privacy_status: string;
  /** 리뷰 내용 */
  review_content: string;
  // 장소 정보
  place_id: string;
  // 지역 서울
  group1: string;
  // 지역 강남구
  group2: string;
  // 지역 신사동
  group3: string;
  // 공개 여부
  is_private: boolean;
  // 별점
  score: number;
}

/**
 * 리뷰 요약 데이터
 */
export interface ReviewSummary {
  /** 총 리뷰 수 */
  total_reviews: number;
  /** 평균 평점 */
  average_rating: number;
  /** 만족도 점수 */
  satisfaction_score: number;
}

/**
 * 카테고리별 분석 데이터
 */
export interface CategoryAnalysis {
  /** 카테고리별 리뷰 개수 */
  count: number;
  /** 카테고리명 */
  category: string;
  /** 평균 평점 */
  average_rating: number;
}

/**
 * 평점 분포 데이터
 */
export interface RatingDistribution {
  /** 해당 평점의 리뷰 개수 */
  count: number;
  /** 평점 */
  rating: number;
  /** 전체 리뷰 대비 비율 (%) */
  percentage: number;
}

/**
 * 사용자 리뷰 분석 데이터
 */
export interface UserReviewAnalysisData {
  /** 태그 분석 배열 */
  tag_analysis: ReviewTagAnalysis[];
  /** 최근 리뷰 배열 */
  recent_reviews: RecentReview[];
  /** 리뷰 요약 */
  review_summary: ReviewSummary;
  /** 카테고리별 분석 배열 */
  category_analysis: CategoryAnalysis[];
  /** 평점 분포 배열 */
  rating_distribution: RatingDistribution[];
}


/**
 * 사용자별 장소 통계 버킷 타입
 */
export type UserPlacesStatsBucket = RecommendationStatsBucket<UserPlacesStatsData>;
