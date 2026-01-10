import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { 
  ChevronLeft,
  X, 
  Pencil, 
  Star, 
  Lock, 
  Trash2, 
  Plus, 
  Loader2,
  Youtube,
  Globe,
  ExternalLink,
  MapPin,
  MapPinCheck,
  Share2,
  Heart,
  Bookmark,
  ChevronRight,
  CookingPot,
  Folder,
  MessageCircle
} from "lucide-react";
import { 
  usePlaceByIdWithRecentView,
  usePlaceUserReviews, 
  usePlaceFeatures,
  useUpsertUserReview,
  useDeleteUserReview,
  useUpsertPlaceFeature,
  useDeletePlaceFeature,
  useToggleLike,
  useToggleSave,
  useToggleVisited
} from "@/entities/place/queries";
import { useMyFolders } from "@/entities/folder/queries";
import { FolderSelectionModal } from "./FolderSelection.modal";
import { useUserStore } from "@/entities/user";
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { ago, safeFormatDate } from "@/shared/lib/date";
import { convertToNaverResizeImageUrl, formatWithCommas } from "@/shared/lib";
import { requestYouTubeMetaService, requestCommunityMetaService } from "@/shared/api/edge-function";
import type { PlaceUserReview, Feature, ReviewTag } from "@/entities/place/types";

/**
 * 장소 상세 모달 컴포넌트
 * /p/status/{place_id} 경로에서 렌더링됩니다.
 */
interface PlaceDetailModalProps {
  /** store에서 전달받은 placeId (전역 모달용) */
  placeIdFromStore?: string;
}

export function PlaceDetailModal({ placeIdFromStore }: PlaceDetailModalProps) {
  const navigate = useNavigate();
  const { id: placeIdFromUrl } = useParams<{ id: string }>();
  const { profile: currentUser, isAuthenticated } = useUserStore();
  const { hide: hideModal, isOpen: isModalFromStore } = usePlacePopup();
  
  // store에서 온 경우 store의 placeId 사용, URL 직접 접근 시 params에서 가져옴
  const placeId = placeIdFromStore || placeIdFromUrl;

  const { data: details, isLoading: isDetailsLoading, isFetching } = usePlaceByIdWithRecentView(placeId!);
  const { data: reviews = [], isLoading: isReviewsLoading } = usePlaceUserReviews(placeId!);
  const { data: placeFeaturesData = [], isLoading: isFeaturesLoading } = usePlaceFeatures(placeId!);
  const { data: myFolders = [] } = useMyFolders({ placeId: placeId! });
  
  // placeId가 변경되면 이전 데이터가 보이지 않도록 체크
  // details.id와 현재 placeId가 다르면 로딩 상태로 처리
  const isDataStale = details && details.id !== placeId;
  const showLoading = isDetailsLoading || isDataStale;

  const upsertReviewMutation = useUpsertUserReview();
  const deleteReviewMutation = useDeleteUserReview(placeId!);
  const upsertPlaceFeatureMutation = useUpsertPlaceFeature();
  const deletePlaceFeatureMutation = useDeletePlaceFeature(placeId!);
  const toggleLikeMutation = useToggleLike();
  const toggleSaveMutation = useToggleSave();
  const toggleVisitedMutation = useToggleVisited();

  const isSavedToAnyFolder = useMemo(() => 
    isAuthenticated && myFolders.some((f: any) => f.is_place_in_folder), 
    [myFolders, isAuthenticated]
  );

  // UI States
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<'youtube' | 'community'>('youtube');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllMenus, setShowAllMenus] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isRequestProcessing, setIsRequestProcessing] = useState(false);

  // Confirmation States
  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState<string | null>(null);
  const [showDeleteFeatureConfirm, setShowDeleteFeatureConfirm] = useState<string | null>(null);

  // Form States
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTagCodes, setSelectedTagCodes] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [gender, setGender] = useState<'M' | 'F' | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [showDemographicsForm, setShowDemographicsForm] = useState(false);

  // Feature Form States
  const [showYoutubeAddForm, setShowYoutubeAddForm] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [showCommunityAddForm, setShowCommunityAddForm] = useState(false);
  const [communityUrlInput, setCommunityUrlInput] = useState('');
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState('');

  // Editing Review States
  const [editingRating, setEditingRating] = useState(0);
  const [editingComment, setEditingComment] = useState('');
  const [editingTagCodes, setEditingTagCodes] = useState<string[]>([]);
  const [editingIsPrivate, setEditingIsPrivate] = useState(false);

  const availableTags: ReviewTag[] = [
    { code: 'local', label: '지역 주민 추천', is_positive: true, group: '추천' },
    { code: 'frequent', label: '자주 방문', is_positive: true, group: '추천' },
    { code: 'again', label: '또 오고싶음', is_positive: true, group: '추천' },
    { code: 'good_atmosphere', label: '분위기 최고', is_positive: true, group: '분위기' },
    { code: 'good_taste', label: '맛 최고', is_positive: true, group: '맛' },
    { code: 'with_gf', label: '여자친구랑', is_positive: true, group: '동반자' },
    { code: 'with_family', label: '가족과', is_positive: true, group: '동반자' },
    { code: 'alone', label: '혼밥', is_positive: true, group: '동반자' },
    { code: 'bad_atmosphere', label: '분위기 별로', is_positive: false, group: '분위기' },
    { code: 'bad_taste', label: '맛 별로', is_positive: false, group: '맛' },
    { code: 'bad_service', label: '서비스 별로', is_positive: false, group: '서비스' },
  ];

  const ageGroupOptions = [
    { label: '10대', value: '10s' },
    { label: '20대', value: '20s' },
    { label: '30대', value: '30s' },
    { label: '40대', value: '40s' },
    { label: '50대 이상', value: '50s+' },
  ];

  // Derived Values
  const allImages = useMemo(() => {
    if (!details) return [];
    const combined = [
      ...(details.images || []),
      ...(details.image_urls || []),
      ...(details.place_images || []),
    ];
    return [...new Set(combined)]; // Unique images
  }, [details]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageSliderRef = useRef<HTMLDivElement>(null);

  // placeId가 변경되면 UI 상태 초기화
  useEffect(() => {
    setCurrentImageIndex(0);
    setShowReviewForm(false);
    setShowAllReviews(false);
    setShowAllMenus(false);
    setEditingReviewId(null);
    setActiveContentTab('youtube');
    setShowYoutubeAddForm(false);
    setShowCommunityAddForm(false);
  }, [placeId]);

  // 스크롤 위치 감지하여 현재 이미지 인덱스 업데이트
  useEffect(() => {
    const slider = imageSliderRef.current;
    if (!slider || allImages.length <= 1) return;

    const handleScroll = () => {
      const scrollLeft = slider.scrollLeft;
      const itemWidth = slider.offsetWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setCurrentImageIndex(Math.min(newIndex, allImages.length - 1));
    };

    slider.addEventListener('scroll', handleScroll, { passive: true });
    return () => slider.removeEventListener('scroll', handleScroll);
  }, [allImages.length]);

  // 도트 클릭 시 해당 이미지로 스크롤
  const scrollToImage = (index: number) => {
    if (!imageSliderRef.current) return;
    const itemWidth = imageSliderRef.current.offsetWidth;
    imageSliderRef.current.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
  };

  const youtubeFeatures = useMemo(() => placeFeaturesData.filter(f => f.platform_type === 'youtube'), [placeFeaturesData]);
  const communityFeatures = useMemo(() => placeFeaturesData.filter(f => f.platform_type === 'community'), [placeFeaturesData]);
  const folderFeatures = useMemo(() => placeFeaturesData.filter(f => f.platform_type === 'folder'), [placeFeaturesData]);
  
  const averageRating = useMemo(() => reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.score, 0) / reviews.length : 0, [reviews]);
  const publicReviews = useMemo(() => reviews.filter(r => !r.is_private || r.is_my_review), [reviews]);
  const displayedReviews = useMemo(() => showAllReviews ? publicReviews : publicReviews.slice(0, 3), [publicReviews, showAllReviews]);
  
  const MAX_VISIBLE_MENUS = 6;
  const visibleMenus = useMemo(() => {
    if (!details?.menus) return [];
    return showAllMenus ? details.menus : details.menus.slice(0, MAX_VISIBLE_MENUS);
  }, [details?.menus, showAllMenus]);

  const hasDemographics = !!(currentUser?.gender_code && currentUser?.age_group_code);

  const handleToggleLike = () => {
    if (!isAuthenticated) return alert('로그인이 필요합니다.');
    toggleLikeMutation.mutate({
      likedId: placeId!,
      likedType: 'place',
      refId: placeId!,
    });
  };

  const handleToggleSave = () => {
    if (!isAuthenticated) return alert('로그인이 필요합니다.');
    toggleSaveMutation.mutate({
      savedId: placeId!,
      savedType: 'place',
      refId: placeId!,
    });
  };

  const handleToggleVisited = () => {
    if (!isAuthenticated) return alert('로그인이 필요합니다.');
    toggleVisitedMutation.mutate({
      placeId: placeId!,
      cancel: details?.experience?.is_visited,
    });
  };

  useEffect(() => {
    if (showReviewForm && currentUser) {
      setGender(currentUser.gender_code as 'M' | 'F' || null);
      setAgeGroup(currentUser.age_group_code || null);
    }
  }, [showReviewForm, currentUser]);

  // 모달이 열릴 때 부모 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    // store에서 열린 모달이면 store로 닫기 (부모 페이지 재마운트 방지)
    if (placeIdFromStore) {
      hideModal();
    } else {
      // URL 직접 접근 시 히스토리 뒤로 가기
      navigate(-1);
    }
  };

  const toggleTag = (code: string) => {
    setSelectedTagCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const toggleEditTag = (code: string) => {
    setEditingTagCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const resetReviewForm = () => {
    setRating(0);
    setComment('');
    setSelectedTagCodes([]);
    setIsPrivate(false);
    setShowReviewForm(false);
  };

  const handleSaveReview = async () => {
    if (!comment.trim()) return alert('코멘트를 입력해주세요.');
    if (comment.length > 200) return alert('코멘트는 200자 이내로 입력해주세요.');

    try {
      await upsertReviewMutation.mutateAsync({
        p_place_id: placeId!,
        p_review_content: comment,
        p_score: rating,
        p_is_private: isPrivate,
        p_gender_code: gender,
        p_age_group_code: ageGroup,
        p_tag_codes: selectedTagCodes,
        p_profile_gender_and_age_by_pass: (gender !== currentUser?.gender_code || ageGroup !== currentUser?.age_group_code)
      });
      resetReviewForm();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleStartEditReview = (review: PlaceUserReview) => {
    setEditingReviewId(review.id);
    setEditingRating(review.score);
    setEditingComment(review.review_content);
    setEditingTagCodes(review.tags.map(t => t.code));
    setEditingIsPrivate(review.is_private);
  };

  const handleSaveEditReview = async (reviewId: string) => {
    if (!editingComment.trim()) return alert('코멘트를 입력해주세요.');
    try {
      await upsertReviewMutation.mutateAsync({
        p_review_id: reviewId,
        p_place_id: placeId!,
        p_review_content: editingComment,
        p_score: editingRating,
        p_is_private: editingIsPrivate,
        p_tag_codes: editingTagCodes,
        p_profile_gender_and_age_by_pass: true
      });
      setEditingReviewId(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteReview = async () => {
    if (!showDeleteReviewConfirm) return;
    try {
      await deleteReviewMutation.mutateAsync(showDeleteReviewConfirm);
      setShowDeleteReviewConfirm(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddFeature = async (platform: 'youtube' | 'community') => {
    const url = platform === 'youtube' ? youtubeUrlInput : communityUrlInput;
    if (!url.trim()) return;

    setIsRequestProcessing(true);
    try {
      let title: string | null = null;
      let metadata: any = null;

      if (platform === 'youtube') {
        const videoId = url.includes('youtu.be') 
          ? url.split('/').pop()?.split('?')[0] 
          : url.match(/[?&]v=([^&]+)/)?.[1];
        if (!videoId) throw new Error('유효한 YouTube URL이 아닙니다.');
        
        const { error, results } = await requestYouTubeMetaService(videoId);
        if (error) throw new Error('YouTube 정보를 가져올 수 없습니다.');
        title = results.title;
        metadata = results;
      } else {
        const { error, results } = await requestCommunityMetaService(url);
        if (error) throw new Error('커뮤니티 정보를 가져올 수 없습니다.');
        title = results.title;
        metadata = results;
      }

      await upsertPlaceFeatureMutation.mutateAsync({
        p_business_id: placeId!,
        p_platform_type: platform,
        p_content_url: url,
        p_title: title,
        p_metadata: metadata
      });

      if (platform === 'youtube') {
        setYoutubeUrlInput('');
        setShowYoutubeAddForm(false);
      } else {
        setCommunityUrlInput('');
        setShowCommunityAddForm(false);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsRequestProcessing(false);
    }
  };

  const handleDeleteFeature = async () => {
    if (!showDeleteFeatureConfirm) return;
    try {
      await deletePlaceFeatureMutation.mutateAsync(showDeleteFeatureConfirm);
      setShowDeleteFeatureConfirm(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getPlatformName = (domain: string) => {
    const names: Record<string, string> = {
      'damoang.net': '다모앙',
      'clien.net': '클리앙',
      'bobaedream.co.kr': '보배드림',
      'youtube': '유튜브'
    };
    return names[domain] || domain;
  };

  // 모달 렌더링
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" />
      
      <div className={cn(
        "relative w-full h-full bg-white dark:bg-surface-950 flex flex-col",
        "md:max-w-md md:h-[90vh] md:rounded-[32px] md:overflow-hidden md:shadow-2xl"
      )}>
        {/* 헤더 */}
        <header className="flex h-14 items-center px-4 border-b border-surface-100 dark:border-surface-800 shrink-0 bg-white dark:bg-surface-900">
          <button onClick={handleClose} className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
          </button>
          <h1 className="ml-3 text-lg font-bold text-surface-900 dark:text-surface-50">
            {details?.name || "장소 상세"}
          </h1>
          <div className="ml-auto">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: details?.name,
                    url: window.location.href,
                  });
                }
              }} 
              className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-600 dark:text-surface-400"
            >
              <Share2 className="size-5" />
            </button>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-y-auto pb-safe scrollbar-hide" style={{ scrollBehavior: 'auto' }}>
          {/* 로딩 상태 */}
          {showLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="size-8 animate-spin text-primary-500" />
              <span className="text-sm font-medium text-surface-400">불러오는 중...</span>
            </div>
          ) : (
          <>
          {/* Hero 이미지 갤러리 - 전체 너비 스와이프 */}
          <div className="relative w-full bg-surface-100 dark:bg-surface-900">
            {allImages.length > 0 ? (
              <>
                <div 
                  ref={imageSliderRef}
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  style={{ 
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {allImages.slice(0, 10).map((img, index) => (
                    <div 
                      key={index}
                      className="flex-shrink-0 w-full aspect-[4/5] snap-center bg-surface-100 dark:bg-surface-900"
                    >
                      <img
                        src={convertToNaverResizeImageUrl(img)}
                        alt={`${details?.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>

                {/* 오버레이 뱃지들 */}
                {details?.avg_price && details.avg_price > 0 && (
                  <div className="absolute top-4 left-4 pointer-events-none">
                    <div className="bg-white/95 dark:bg-surface-900/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                      <span className="text-[13px] font-black text-surface-800 dark:text-white">
                        {formatWithCommas(details.avg_price, '-', true)}원대
                      </span>
                    </div>
                  </div>
                )}

                {folderFeatures.length > 0 && (
                  <div className="absolute top-4 right-4 pointer-events-none">
                    <div className="bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <span className="text-[11px] font-black">{folderFeatures.length}</span>
                      <span className="text-[10px] font-bold opacity-90">폴더</span>
                    </div>
                  </div>
                )}

                {/* 도트 인디케이터 */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
                    {allImages.slice(0, 10).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => scrollToImage(index)}
                        className={cn(
                          "rounded-full transition-all duration-200",
                          currentImageIndex === index 
                            ? "w-5 h-1.5 bg-white" 
                            : "w-1.5 h-1.5 bg-white/50 hover:bg-white/70"
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* 방문 뱃지 */}
                {details?.experience?.is_visited && (
                  <div className="absolute bottom-4 right-4 bg-primary-500 text-white px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 pointer-events-none">
                    <MapPinCheck className="size-3.5" />
                    <span className="text-[11px] font-bold">방문완료</span>
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[4/5] flex flex-col items-center justify-center">
                <Globe className="size-12 text-surface-300 dark:text-surface-700" />
                <span className="text-[13px] text-surface-400 dark:text-surface-600 mt-2 font-medium">이미지 준비중</span>
              </div>
            )}
          </div>

          <div className="px-4 pt-4 pb-6">
            {/* 인스타 스타일 상호작용 바 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleToggleLike}
                  className="group active:scale-90 transition-transform"
                >
                  <Heart 
                    className={cn(
                      "size-7 transition-colors",
                      details?.interaction?.is_liked 
                        ? "fill-rose-500 text-rose-500" 
                        : "text-surface-700 dark:text-surface-300"
                    )} 
                  />
                </button>
                <button 
                  onClick={() => {
                    const reviewSection = document.getElementById('review-section');
                    reviewSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group active:scale-90 transition-transform"
                >
                  <MessageCircle className="size-7 text-surface-700 dark:text-surface-300" />
                </button>
                <a
                  href={`https://map.naver.com/p/entry/place/${placeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="active:scale-90 transition-transform"
                >
                  <MapPin className="size-7 text-surface-700 dark:text-surface-300" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => isAuthenticated ? setShowFolderModal(true) : alert('로그인이 필요합니다.')}
                  className="group active:scale-90 transition-transform"
                >
                  <Folder 
                    className={cn(
                      "size-7 transition-colors",
                      isSavedToAnyFolder 
                        ? "fill-emerald-500 text-emerald-500" 
                        : "text-surface-700 dark:text-surface-300"
                    )} 
                  />
                </button>
                <button 
                  onClick={handleToggleSave}
                  className="group active:scale-90 transition-transform"
                >
                  <Bookmark 
                    className={cn(
                      "size-7 transition-colors",
                      details?.interaction?.is_saved 
                        ? "fill-surface-900 text-surface-900 dark:fill-white dark:text-white" 
                        : "text-surface-700 dark:text-surface-300"
                    )} 
                  />
                </button>
              </div>
            </div>

            {/* 좋아요 수 */}
            {(details?.interaction?.place_liked_count || 0) > 0 && (
              <div className="mb-3">
                <span className="text-[14px] font-bold text-surface-900 dark:text-white">
                  좋아요 {details?.interaction?.place_liked_count}개
                </span>
              </div>
            )}

            {/* 장소명 + 위치 */}
            <div className="mb-4">
              <div className="flex items-start gap-2 mb-1">
                <h1 className="text-[18px] font-black text-surface-900 dark:text-white leading-tight">
                  {details?.name || "장소 정보"}
                </h1>
                {folderFeatures.length > 0 && (
                  <div 
                    className={cn(
                      "mt-1.5 h-1.5 rounded-full flex-shrink-0 w-10",
                      folderFeatures.length >= 15 ? "bg-emerald-600" :
                      folderFeatures.length >= 10 ? "bg-emerald-500" :
                      folderFeatures.length >= 5 ? "bg-emerald-400" :
                      "bg-emerald-300"
                    )} 
                  />
                )}
              </div>
              <div className="flex items-center gap-2 text-[14px] text-surface-500 dark:text-surface-400">
                <span className="font-medium">{details?.group2} {details?.group3}</span>
                <span>·</span>
                <div className="flex items-center gap-0.5">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{details?.visitor_reviews_score?.toFixed(1) || "0.0"}</span>
                </div>
                <span>·</span>
                <span className="font-medium">리뷰 {details?.visitor_reviews_total || 0}</span>
              </div>
              {details?.road_address && (
                <p className="text-[13px] text-surface-400 dark:text-surface-500 mt-1 font-medium">
                  {details.road_address}
                </p>
              )}
            </div>

            {/* 가봤어요 버튼 */}
            <button
              onClick={handleToggleVisited}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-black transition-all active:scale-[0.98]",
                details?.experience?.is_visited
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none"
                  : "bg-surface-100 dark:bg-surface-900 text-surface-500 dark:text-surface-400"
              )}
            >
              <MapPinCheck className="size-5" />
              {details?.experience?.is_visited ? "방문했어요!" : "가봤어요"}
            </button>

            {/* 폴더 태그 */}
            {folderFeatures.length > 0 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
                {folderFeatures.slice(0, 4).map(folder => (
                  <button 
                    key={folder.id}
                    className="flex-shrink-0 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[12px] font-bold rounded-lg border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors active:scale-95"
                    onClick={() => navigate(`/folder/${folder.id}`)}
                  >
                    📁 {folder.title}
                  </button>
                ))}
                {folderFeatures.length > 4 && (
                  <span className="flex-shrink-0 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 text-surface-500 text-[12px] font-bold rounded-lg">
                    +{folderFeatures.length - 4}개
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="px-4 pb-6">
            {/* 소개 문구 (있다면) */}
            {details?.road && (
              <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900 mb-6">
                <p className="text-[14px] font-medium leading-relaxed text-surface-600 dark:text-surface-400 whitespace-pre-line">
                  {details.road}
                </p>
              </div>
            )}

            {/* 메뉴 섹션 */}
            {details?.menus && details.menus.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-xl font-black tracking-tight text-surface-900 dark:text-white">메뉴</h3>
                  <span className="text-xs font-bold text-surface-400">{details.menus.length}개</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {visibleMenus.map((menu, idx) => (
                    <div key={idx} className="flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-surface-900 border border-surface-50 dark:border-surface-800 shadow-sm">
                      <div className="relative aspect-square bg-surface-50 dark:bg-surface-800 overflow-hidden">
                        {menu.images?.[0] ? (
                          <img 
                            src={convertToNaverResizeImageUrl(menu.images[0])} 
                            alt={menu.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-100/50 dark:bg-surface-800/50">
                            <CookingPot className="size-9 text-surface-300 dark:text-surface-600" />
                          </div>
                        )}
                        {menu.recommend && (
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-yellow-400 text-[9px] font-black text-white shadow-sm flex items-center gap-0.5">
                            <Star className="size-2 fill-current" />
                            대표
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col items-center justify-center text-center">
                        <h4 className="text-[11px] font-bold text-surface-900 dark:text-white line-clamp-2 leading-tight mb-1">
                          {menu.name}
                        </h4>
                        {menu.price && (
                          <p className="text-[10px] font-black text-primary-600">
                            {formatWithCommas(menu.price)}원
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {!showAllMenus && details.menus.length > MAX_VISIBLE_MENUS && (
                  <button 
                    onClick={() => setShowAllMenus(true)}
                    className="w-full mt-6 h-12 rounded-xl border border-surface-200 dark:border-surface-800 text-[13px] font-bold text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-900 flex items-center justify-center gap-2"
                  >
                    모든 메뉴 보기 ({details.menus.length}개)
                    <ChevronRight className="size-4" />
                  </button>
                )}
              </div>
            )}

            {/* 요약 영역 */}
            {!showReviewForm && (
              <div className="mb-8 p-5 rounded-3xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-primary-700 dark:text-primary-300 mb-1">방문 후기를 들려주세요!</p>
                  <p className="text-xs text-primary-600/70 dark:text-primary-400/70">직접 방문한 경험을 공유하면<br />다른 분들께 큰 도움이 됩니다.</p>
                </div>
                
                <Button 
                  onClick={() => isAuthenticated ? setShowReviewForm(true) : alert('로그인이 필요합니다.')}
                  disabled={!isAuthenticated}
                  className="rounded-2xl h-12 px-5 font-black gap-2 shadow-lg shadow-primary-200 dark:shadow-none"
                >
                  <Pencil className="size-4" />
                  기록하기
                </Button>
              </div>
            )}

            {/* 리뷰 작성 폼 */}
            {showReviewForm && (
              <div className="mb-8 p-6 rounded-3xl border-2 border-primary-100 dark:border-primary-900/30 bg-white dark:bg-surface-950 shadow-xl shadow-primary-100/50 dark:shadow-none">
                <div className="space-y-8">
                  <section>
                    <label className="block text-sm font-black mb-4 flex items-center gap-2 text-surface-900 dark:text-white">
                      <Star className="size-4 text-primary-500 fill-primary-500" />
                      이곳은 어떠셨나요?
                    </label>
                    <div className="flex justify-between px-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)} className="group relative">
                          <Star className={cn(
                            "size-10", 
                            s <= rating ? "text-yellow-400 fill-current drop-shadow-sm" : "text-surface-100 dark:text-surface-800"
                          )} />
                          {s === rating && (
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <label className="block text-sm font-black mb-4 text-surface-900 dark:text-white">어떤 점이 좋았나요?</label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                        <button
                          key={tag.code}
                          onClick={() => toggleTag(tag.code)}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold border",
                            selectedTagCodes.includes(tag.code)
                              ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100"
                              : "bg-surface-50 dark:bg-surface-900 text-surface-500 border-surface-100 dark:border-surface-800"
                          )}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-black text-surface-900 dark:text-white">사용자 정보</label>
                      <button 
                        onClick={() => setShowDemographicsForm(!showDemographicsForm)} 
                        className="text-[10px] font-black tracking-widest uppercase text-primary-600 px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-950/50"
                      >
                        {showDemographicsForm ? "CLOSE" : "EDIT"}
                      </button>
                    </div>
                    
                    {!showDemographicsForm && hasDemographics ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-surface-400 bg-surface-50 dark:bg-surface-900 px-4 py-3 rounded-xl">
                        <div className="size-1.5 rounded-full bg-green-500" />
                        기본 정보({currentUser?.gender_code === 'M' ? '남성' : '여성'}, {currentUser?.age_group_code})가 적용됩니다.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setGender('M')} 
                            className={cn(
                              "flex-1 h-12 rounded-xl font-bold text-sm border",
                              gender === 'M' ? "bg-primary-600 text-white border-primary-600" : "bg-white dark:bg-surface-900 border-surface-100 dark:border-surface-800 text-surface-400"
                            )}
                          >남성</button>
                          <button 
                            onClick={() => setGender('F')} 
                            className={cn(
                              "flex-1 h-12 rounded-xl font-bold text-sm border",
                              gender === 'F' ? "bg-primary-600 text-white border-primary-600" : "bg-white dark:bg-surface-900 border-surface-100 dark:border-surface-800 text-surface-400"
                            )}
                          >여성</button>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {ageGroupOptions.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setAgeGroup(opt.value)}
                              className={cn(
                                "h-10 rounded-lg text-xs font-bold border",
                                ageGroup === opt.value 
                                  ? "bg-primary-600 text-white border-primary-600 shadow-sm" 
                                  : "bg-surface-50 dark:bg-surface-900 border-surface-100 dark:border-surface-800 text-surface-400"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>

                  <section>
                    <label className="block text-sm font-black mb-4 text-surface-900 dark:text-white">한줄 평</label>
                    <div className="relative">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="이 장소에 대한 솔직한 평을 남겨주세요."
                        className="w-full h-32 p-5 rounded-2xl bg-surface-50 dark:bg-surface-900 border-none resize-none focus:ring-2 focus:ring-primary-500 font-medium text-sm text-surface-700 dark:text-surface-300"
                        maxLength={200}
                      />
                      <div className="absolute bottom-4 right-5 text-[10px] font-bold text-surface-300">
                        {comment.length}/200
                      </div>
                    </div>
                  </section>

                  <div className="flex items-center gap-3 bg-surface-50 dark:bg-surface-900 p-4 rounded-2xl">
                    <input 
                      type="checkbox" 
                      id="private" 
                      checked={isPrivate} 
                      onChange={(e) => setIsPrivate(e.target.checked)} 
                      className="size-5 rounded-md border-surface-200 text-primary-600 focus:ring-primary-500" 
                    />
                    <label htmlFor="private" className="text-sm font-bold text-surface-600 dark:text-surface-400">나만 보기 (비공개)</label>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={resetReviewForm} className="flex-1 h-14 rounded-2xl font-black text-surface-400">취소</Button>
                    <Button onClick={handleSaveReview} className="flex-[2] h-14 rounded-2xl font-black shadow-lg shadow-primary-200">기록 완료</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* 리뷰 섹션 */}
              <section id="review-section" className="scroll-mt-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[17px] font-black text-surface-900 dark:text-white flex items-center gap-2">
                    <MessageCircle className="size-5" />
                    방문 리뷰
                    <span className="text-primary-500">{publicReviews.length}</span>
                  </h3>
                </div>
                
                {publicReviews.length > 0 ? (
                  <div className="space-y-3">
                    {displayedReviews.map(review => (
                      <article key={review.id} className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900">
                        <div className="flex gap-3">
                          <img 
                            src={review.user_profile?.profile_image_url || "/default-avatar.png"} 
                            className="size-9 rounded-full bg-surface-200 shrink-0 object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/default-avatar.png";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[13px] text-surface-900 dark:text-white">
                                  {review.user_profile?.nickname || "익명"}
                                </span>
                                {review.is_private && <Lock className="size-3 text-surface-400" />}
                                <span className="text-[11px] text-surface-400">
                                  {safeFormatDate(review.created_at)}
                                </span>
                              </div>
                              
                              {review.is_my_review && !editingReviewId && (
                                <div className="flex gap-1">
                                  <button onClick={() => handleStartEditReview(review)} className="p-1.5 text-surface-400 hover:text-surface-700 rounded-lg active:scale-90 transition-transform">
                                    <Pencil className="size-3.5" />
                                  </button>
                                  <button onClick={() => setShowDeleteReviewConfirm(review.id)} className="p-1.5 text-surface-400 hover:text-rose-500 rounded-lg active:scale-90 transition-transform">
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-0.5 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn("size-3.5", i < review.score ? "fill-amber-400 text-amber-400" : "text-surface-200 dark:text-surface-700")} />
                              ))}
                            </div>

                            {editingReviewId === review.id ? (
                              <div className="space-y-3 p-3 rounded-xl bg-white dark:bg-surface-800 mt-2">
                                <div className="flex gap-1">
                                  {[1,2,3,4,5].map(s => (
                                    <button key={s} onClick={() => setEditingRating(s)} className="active:scale-90 transition-transform">
                                      <Star className={cn("size-6", s <= editingRating ? "fill-amber-400 text-amber-400" : "text-surface-200")} />
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  value={editingComment}
                                  onChange={(e) => setEditingComment(e.target.value)}
                                  className="w-full p-3 rounded-lg bg-surface-50 dark:bg-surface-900 border-none resize-none font-medium text-[13px] text-surface-700 dark:text-surface-300"
                                  rows={2}
                                />
                                <div className="flex flex-wrap gap-1.5">
                                  {availableTags.map(tag => (
                                    <button
                                      key={tag.code}
                                      onClick={() => toggleEditTag(tag.code)}
                                      className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors",
                                        editingTagCodes.includes(tag.code) 
                                          ? "bg-primary-500 text-white" 
                                          : "bg-surface-100 dark:bg-surface-700 text-surface-500"
                                      )}
                                    >
                                      {tag.label}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingReviewId(null)} className="h-8 px-3 text-[12px] font-bold text-surface-400">취소</Button>
                                  <Button size="sm" onClick={() => handleSaveEditReview(review.id)} className="h-8 px-4 text-[12px] font-bold">저장</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-[13px] leading-relaxed text-surface-600 dark:text-surface-400">{review.review_content}</p>
                                {review.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {review.tags.map(tag => (
                                      <span key={tag.code} className="px-2 py-0.5 rounded-md bg-primary-100/50 dark:bg-primary-900/30 text-[10px] font-bold text-primary-600 dark:text-primary-400">
                                        {tag.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 bg-surface-50 dark:bg-surface-900 rounded-2xl">
                    <MessageCircle className="size-10 text-surface-200 dark:text-surface-700" />
                    <p className="text-[13px] font-bold text-surface-400">아직 리뷰가 없어요</p>
                    <p className="text-[12px] text-surface-400">첫 번째 리뷰를 남겨주세요!</p>
                  </div>
                )}

                {publicReviews.length > 3 && !showAllReviews && (
                  <button 
                    onClick={() => setShowAllReviews(true)} 
                    className="w-full mt-3 h-11 rounded-xl font-bold text-[13px] text-surface-500 bg-surface-100 dark:bg-surface-900 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors flex items-center justify-center gap-1"
                  >
                    리뷰 더보기
                    <span className="text-primary-500 font-black">+{publicReviews.length - 3}</span>
                  </button>
                )}
              </section>

              {/* 관련 콘텐츠 섹션 - 핵심 기능 강조 */}
              <section className="bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-950 -mx-4 px-4 py-6 rounded-t-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[17px] font-black text-surface-900 dark:text-white flex items-center gap-2">
                    🔗 관련 콘텐츠
                    <span className="text-primary-500">{youtubeFeatures.length + communityFeatures.length}</span>
                  </h3>
                </div>

                {/* 콘텐츠 타입 탭 */}
                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => setActiveContentTab('youtube')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all",
                      activeContentTab === 'youtube' 
                        ? "bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-none" 
                        : "bg-white dark:bg-surface-800 text-surface-400 border border-surface-100 dark:border-surface-700"
                    )}
                  >
                    <Youtube className="size-4" />
                    유튜브
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                      activeContentTab === 'youtube' ? "bg-white/20" : "bg-surface-100 dark:bg-surface-700"
                    )}>
                      {youtubeFeatures.length}
                    </span>
                  </button>
                  <button 
                    onClick={() => setActiveContentTab('community')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all",
                      activeContentTab === 'community' 
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-none" 
                        : "bg-white dark:bg-surface-800 text-surface-400 border border-surface-100 dark:border-surface-700"
                    )}
                  >
                    <Globe className="size-4" />
                    커뮤니티
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                      activeContentTab === 'community' ? "bg-white/20" : "bg-surface-100 dark:bg-surface-700"
                    )}>
                      {communityFeatures.length}
                    </span>
                  </button>
                </div>

                {/* 링크 추가 영역 - 항상 표시 (로그인 시) */}
                {isAuthenticated && (
                  <div className="mb-4">
                    {(showYoutubeAddForm || showCommunityAddForm) ? (
                      <div className={cn(
                        "p-4 rounded-2xl border-2 space-y-3",
                        activeContentTab === 'youtube' 
                          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50" 
                          : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50"
                      )}>
                        <div className="flex items-center gap-2">
                          {activeContentTab === 'youtube' ? (
                            <Youtube className="size-5 text-red-500" />
                          ) : (
                            <Globe className="size-5 text-blue-500" />
                          )}
                          <span className="text-[13px] font-bold text-surface-700 dark:text-surface-300">
                            {activeContentTab === 'youtube' ? "YouTube 영상 추가" : "커뮤니티 글 추가"}
                          </span>
                        </div>
                        <Input 
                          placeholder={activeContentTab === 'youtube' ? "YouTube 링크를 붙여넣으세요" : "커뮤니티 글 링크를 붙여넣으세요"}
                          value={activeContentTab === 'youtube' ? youtubeUrlInput : communityUrlInput}
                          onChange={(e) => activeContentTab === 'youtube' ? setYoutubeUrlInput(e.target.value) : setCommunityUrlInput(e.target.value)}
                          className="h-12 rounded-xl border-none bg-white dark:bg-surface-800 text-[14px] placeholder:text-surface-400"
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            onClick={() => activeContentTab === 'youtube' ? setShowYoutubeAddForm(false) : setShowCommunityAddForm(false)} 
                            className="flex-1 h-11 rounded-xl font-bold text-surface-500"
                          >
                            취소
                          </Button>
                          <Button 
                            onClick={() => handleAddFeature(activeContentTab)} 
                            disabled={isRequestProcessing} 
                            className={cn(
                              "flex-[2] h-11 rounded-xl font-black",
                              activeContentTab === 'youtube' ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                            )}
                          >
                            {isRequestProcessing ? <Loader2 className="size-4 animate-spin" /> : "추가하기"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => activeContentTab === 'youtube' ? setShowYoutubeAddForm(true) : setShowCommunityAddForm(true)}
                        className={cn(
                          "w-full p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                          activeContentTab === 'youtube' 
                            ? "border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" 
                            : "border-blue-200 dark:border-blue-900/50 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        )}
                      >
                        <Plus className="size-5" />
                        <span className="text-[14px] font-bold">
                          {activeContentTab === 'youtube' ? "이 맛집이 나온 유튜브 영상 추가" : "이 맛집이 소개된 글 추가"}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* 콘텐츠 목록 */}
                <div className="space-y-3">
                  {activeContentTab === 'youtube' ? (
                    youtubeFeatures.length > 0 ? (
                      youtubeFeatures.map(feature => (
                        <a 
                          key={feature.id} 
                          href={feature.content_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="group block bg-white dark:bg-surface-800 rounded-2xl overflow-hidden border border-surface-100 dark:border-surface-700 hover:shadow-lg transition-shadow"
                        >
                          {/* 썸네일 - 크게 */}
                          <div className="relative aspect-video bg-surface-100 dark:bg-surface-900">
                            <img 
                              src={feature.metadata?.thumbnails?.medium?.url || feature.metadata?.thumbnails?.default?.url} 
                              className="w-full h-full object-cover"
                              alt={feature.title}
                            />
                            {/* 재생 버튼 오버레이 */}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="size-14 rounded-full bg-red-500 flex items-center justify-center shadow-xl">
                                <div className="w-0 h-0 border-l-[18px] border-l-white border-t-[11px] border-t-transparent border-b-[11px] border-b-transparent ml-1" />
                              </div>
                            </div>
                            {/* YouTube 뱃지 */}
                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Youtube className="size-3" />
                              <span className="text-[10px] font-bold">YouTube</span>
                            </div>
                            {/* 내가 추가한 경우 삭제 버튼 */}
                            {feature.user_id === currentUser?.auth_user_id && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowDeleteFeatureConfirm(feature.id);
                                }} 
                                className="absolute top-2 right-2 size-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                          {/* 영상 정보 */}
                          <div className="p-3">
                            <h4 className="text-[14px] font-bold text-surface-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">
                              {feature.title}
                            </h4>
                            <p className="text-[12px] text-surface-500 mt-1 font-medium">
                              {feature.metadata?.channelTitle}
                            </p>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center gap-3 bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700">
                        <div className="size-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                          <Youtube className="size-8 text-red-300 dark:text-red-800" />
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-surface-600 dark:text-surface-400">관련 영상이 없어요</p>
                          <p className="text-[12px] text-surface-400 mt-1">이 맛집이 나온 영상을 공유해주세요!</p>
                        </div>
                      </div>
                    )
                  ) : (
                    communityFeatures.length > 0 ? (
                      communityFeatures.map(feature => (
                        <a 
                          key={feature.id}
                          href={feature.content_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="group flex items-center gap-3 p-4 bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 hover:shadow-lg transition-shadow"
                        >
                          {/* 플랫폼 아이콘 */}
                          <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                            <Globe className="size-6 text-blue-500" />
                          </div>
                          {/* 글 정보 */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-bold text-surface-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors">
                              {feature.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                {getPlatformName(feature.metadata?.domain)}
                              </span>
                            </div>
                          </div>
                          {/* 액션 */}
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="size-9 rounded-lg flex items-center justify-center text-surface-300 group-hover:text-blue-500">
                              <ExternalLink className="size-5" />
                            </div>
                            {feature.user_id === currentUser?.auth_user_id && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowDeleteFeatureConfirm(feature.id);
                                }} 
                                className="size-9 rounded-lg flex items-center justify-center text-surface-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center gap-3 bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700">
                        <div className="size-16 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                          <Globe className="size-8 text-blue-300 dark:text-blue-800" />
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-surface-600 dark:text-surface-400">관련 글이 없어요</p>
                          <p className="text-[12px] text-surface-400 mt-1">이 맛집 관련 글을 공유해주세요!</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!showDeleteReviewConfirm} onOpenChange={(open) => !open && setShowDeleteReviewConfirm(null)}>
        <DialogContent className="rounded-[32px] p-8 max-w-[320px]">
          <div className="flex flex-col items-center text-center">
            <div className="size-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6">
              <Trash2 className="size-8" />
            </div>
            <DialogTitle className="text-xl font-black mb-2">리뷰 삭제</DialogTitle>
            <p className="text-sm font-medium text-surface-500 leading-relaxed mb-8">
              정말로 이 리뷰를 삭제하시겠습니까?<br />삭제된 데이터는 복구할 수 없습니다.
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="ghost" onClick={() => setShowDeleteReviewConfirm(null)} className="flex-1 h-12 rounded-xl font-bold text-surface-400">취소</Button>
              <Button variant="primary" className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700" onClick={handleDeleteReview}>삭제하기</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeleteFeatureConfirm} onOpenChange={(open) => !open && setShowDeleteFeatureConfirm(null)}>
        <DialogContent className="rounded-[32px] p-8 max-w-[320px]">
          <div className="flex flex-col items-center text-center">
            <div className="size-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6">
              <Trash2 className="size-8" />
            </div>
            <DialogTitle className="text-xl font-black mb-2">콘텐츠 삭제</DialogTitle>
            <p className="text-sm font-medium text-surface-500 leading-relaxed mb-8">
              정말로 이 콘텐츠를 삭제하시겠습니까?<br />삭제된 데이터는 복구할 수 없습니다.
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="ghost" onClick={() => setShowDeleteFeatureConfirm(null)} className="flex-1 h-12 rounded-xl font-bold text-surface-400">취소</Button>
              <Button variant="primary" className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700" onClick={handleDeleteFeature}>삭제하기</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showFolderModal && (
        <FolderSelectionModal 
          placeId={placeId!} 
          onClose={() => setShowFolderModal(false)} 
          onCloseAll={handleClose}
        />
      )}
    </div>,
    document.body
  );
}
