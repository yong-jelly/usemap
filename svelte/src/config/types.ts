/**
 * 투표 응답 인터페이스
 * 
 * @property provider - 컨텐츠 제공자 (예: clien)
 * @property content_type - 컨텐츠 유형 (예: comment, post)
 * @property content_id - 컨텐츠 고유 식별자
 * @property content_user_id - 컨텐츠 작성자 ID
 * @property up_vote_count - 추천/좋아요 수
 * @property down_vote_count - 비추천/싫어요 수
 * @property total_vote_count - 총 투표 수
 * @property url - 컨텐츠 URL
 * @property last_activity - 마지막 활동 시간
 */
export interface VoteListResponse {
    provider: string;
    content_type: string;
    content_id: string;
    content_user_id: string;
    up_vote_count: string;
    down_vote_count: string;
    total_vote_count: string;
    url: string;
    last_activity: string;
  }
  
  /**
   * 투표 목록 요청 DTO
   * 
   * @property provider - 컨텐츠 제공자 (선택 사항)
   * @property interval - 시간 간격 ('1h', '6h', '24h', '7d', '30d', 'all' 중 하나, 기본값: 'all')
   * @property order - 정렬 기준 ('up_vote_count', 'down_vote_count', 'total_vote_count' 중 하나, 기본값: 'total_vote_count')
   * @property limit - 반환할 항목 수 (1-100 사이의 정수, 기본값: 10)
   */
  export class VoteListRequest {
    provider?: string;
    interval?: '1h'| '6h'| '24h'| '7d'| '30d'| 'all' = 'all';
    order?: 'up_vote_count' | 'down_vote_count' | 'total_vote_count' = 'total_vote_count';
    limit?: number = 10;
  }
  

  /**
   * 태그 목록 응답 인터페이스
   * 
   * @property tag_name - 태그 이름
   * @property tag_group - 태그 그룹 (영문)
   * @property tag_group_ko - 태그 그룹 (한글)
   * @property holder_count - 태그 보유자 수
   * @property tag_count - 태그 사용 횟수
   * @property top_tagged_user - 가장 많이 태그된 사용자
   * @property top_tagged_user_provider - 가장 많이 태그된 사용자의 제공자
   * @property top_tag_count - 가장 많이 태그된 횟수
   * @property last_activity - 마지막 활동 시간
   */
  export interface TagListResponse {
    tag_name: string;
    tag_group: string;
    tag_group_ko: string;
    holder_count: string;
    tag_count: string;
    top_tagged_user: string;
    top_tagged_user_provider: string;
    top_tag_count: string;
    last_activity: string;
  }


  /**
   * 사용자 목록 응답 인터페이스
   * 
   * @property user_id - 사용자 ID
   * @property provider - 사용자 제공자 (플랫폼)
   * @property activity_points - 활동 점수
   * @property contribution - 기여도
   * @property feedback - 피드백 점수
   * @property balance - 밸런스 점수
   * @property total_actions - 총 활동 수
   * @property karma_score - 카르마 점수
   * @property karma_level - 카르마 레벨
   * @property main_activity - 주요 활동 유형
   * @property memo_received_count - 메모 받은 수
   * @property received_positive_count - 받은 긍정 수
   * @property received_negative_count - 받은 부정 수
   * @property tag_count - 태그 수
   * @property tag_received_count - 태그 받은 수
   */
  export interface UserListResponse {
    user_id: string;
    provider: string;
    activity_points: number;
    memo_received_count: number;
    received_positive_count: number;
    received_negative_count: number;
    contribution: number;
    feedback: number;
    balance: number;
    total_actions: number;
    karma_score: number;
    karma_level: string;
    main_activity: string;
    tag_count: number;
    tag_received_count: number;
  }

  /**
   * 메모 목록 응답 인터페이스
   * 
   * @property memo_id - 메모 ID
   * @property memoed_user_id - 메모된 사용자 ID
   * @property memo_content - 메모 내용
   * @property is_public - 공개 여부
   * @property provider - 제공자 (플랫폼)
   * @property created - 생성 일시
   */
  export interface MemoListResponse {
    memo_id: string;
    memoed_user_id: string;
    memo_content: string;
    is_public: boolean;
    provider: string;
    created: string;
  }