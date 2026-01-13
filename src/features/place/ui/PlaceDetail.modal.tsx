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
  useVisitStats
} from "@/entities/place/queries";
import { useMyFolders } from "@/entities/folder/queries";
import { FolderSelectionModal } from "./FolderSelection.modal";
import { VisitHistoryModal } from "./VisitHistory.modal";
import { useUserStore } from "@/entities/user";
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { safeFormatDate } from "@/shared/lib/date";
import { convertToNaverResizeImageUrl, formatWithCommas } from "@/shared/lib";
import { requestYouTubeMetaService, requestCommunityMetaService } from "@/shared/api/edge-function";
import type { PlaceUserReview, Feature, ReviewTag } from "@/entities/place/types";

/**
 * 장소 상세 모달 컴포넌트
 * 모바일 최적화: backdrop-blur 제거, shadow 최소화, 조건부 렌더링 적용
 */
interface PlaceDetailModalProps {
  placeIdFromStore?: string;
}

export function PlaceDetailModal({ placeIdFromStore }: PlaceDetailModalProps) {
  const navigate = useNavigate();
  const { id: placeIdFromUrl } = useParams<{ id: string }>();
  const { profile: currentUser, isAuthenticated } = useUserStore();
  const { hide: hideModal } = usePlacePopup();
  
  const placeId = placeIdFromStore || placeIdFromUrl;

  const { data: details, isLoading: isDetailsLoading } = usePlaceByIdWithRecentView(placeId!);
  const { data: reviews = [] } = usePlaceUserReviews(placeId!);
  const { data: placeFeaturesData = [] } = usePlaceFeatures(placeId!);
  const { data: myFolders = [] } = useMyFolders({ placeId: placeId! });
  const { data: visitStats } = useVisitStats(placeId!);
  
  const isDataStale = details && details.id !== placeId;
  const showLoading = isDetailsLoading || isDataStale;

  const upsertReviewMutation = useUpsertUserReview();
  const deleteReviewMutation = useDeleteUserReview(placeId!);
  const upsertPlaceFeatureMutation = useUpsertPlaceFeature();
  const deletePlaceFeatureMutation = useDeletePlaceFeature(placeId!);
  const toggleLikeMutation = useToggleLike();
  const toggleSaveMutation = useToggleSave();

  const isSavedToAnyFolder = useMemo(() => 
    isAuthenticated && myFolders.some((f: any) => f.is_place_in_folder), 
    [myFolders, isAuthenticated]
  );

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<'youtube' | 'community'>('youtube');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllMenus, setShowAllMenus] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isRequestProcessing, setIsRequestProcessing] = useState(false);

  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState<string | null>(null);
  const [showDeleteFeatureConfirm, setShowDeleteFeatureConfirm] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTagCodes, setSelectedTagCodes] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [gender, setGender] = useState<'M' | 'F' | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [showDemographicsForm, setShowDemographicsForm] = useState(false);

  const [showYoutubeAddForm, setShowYoutubeAddForm] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showVisitHistoryModal, setShowVisitHistoryModal] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [showCommunityAddForm, setShowCommunityAddForm] = useState(false);
  const [communityUrlInput, setCommunityUrlInput] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10;

  const [editingRating, setEditingRating] = useState(0);
  const [editingComment, setEditingComment] = useState('');
  const [editingTagCodes, setEditingTagCodes] = useState<string[]>([]);
  const [editingIsPrivate, setEditingIsPrivate] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageSliderRef = useRef<HTMLDivElement>(null);

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

  const allImages = useMemo(() => {
    if (!details) return [];
    const combined = [
      ...(details.images || []),
      ...(details.image_urls || []),
      ...(details.place_images || []),
    ];
    return [...new Set(combined)];
  }, [details]);

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

  const scrollToImage = (index: number) => {
    if (!imageSliderRef.current) return;
    const itemWidth = imageSliderRef.current.offsetWidth;
    imageSliderRef.current.scrollTo({ left: itemWidth * index, behavior: 'auto' });
  };

  const youtubeFeatures = useMemo(() => placeFeaturesData.filter(f => f.platform_type === 'youtube'), [placeFeaturesData]);
  const communityFeatures = useMemo(() => placeFeaturesData.filter(f => f.platform_type === 'community'), [placeFeaturesData]);
  const folderFeatures = useMemo(() => placeFeaturesData.filter(f => f.platform_type === 'folder'), [placeFeaturesData]);
  
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
    toggleLikeMutation.mutate({ likedId: placeId!, likedType: 'place', refId: placeId! });
  };

  const handleToggleSave = () => {
    if (!isAuthenticated) return alert('로그인이 필요합니다.');
    toggleSaveMutation.mutate({ savedId: placeId!, savedType: 'place', refId: placeId! });
  };

  useEffect(() => {
    if (showReviewForm && currentUser) {
      setGender(currentUser.gender_code as 'M' | 'F' || null);
      setAgeGroup(currentUser.age_group_code || null);
    }
  }, [showReviewForm, currentUser]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    if (placeIdFromStore) hideModal();
    else navigate(-1);
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
    } catch (e: any) { alert(e.message); }
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
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteReview = async () => {
    if (!showDeleteReviewConfirm) return;
    try {
      await deleteReviewMutation.mutateAsync(showDeleteReviewConfirm);
      setShowDeleteReviewConfirm(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleAddFeature = async (platform: 'youtube' | 'community') => {
    const url = platform === 'youtube' ? youtubeUrlInput : communityUrlInput;
    if (!url.trim()) return;
    setIsRequestProcessing(true);
    setRetryCount(0);
    try {
      let title: string | null = null;
      let metadata: any = null;
      if (platform === 'youtube') {
        const videoId = url.includes('youtu.be') ? url.split('/').pop()?.split('?')[0] : url.match(/[?&]v=([^&]+)/)?.[1];
        if (!videoId) throw new Error('유효한 YouTube URL이 아닙니다.');
        const { error, results } = await requestYouTubeMetaService(videoId);
        if (error) throw new Error('YouTube 정보를 가져올 수 없습니다.');
        title = results.title; metadata = results;
      } else {
        // 커뮤니티 정보 가져오기 재시도 로직
        let communityResults = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          setRetryCount(attempt);
          try {
            const { error: metaError, results } = await requestCommunityMetaService(url);
            
            if (!metaError && results) {
              // 클리앙 차단 패턴 체크 (notConnection.html?blockedIp)
              const isClienBlocked = results.domain === 'clien.net' && 
                                   results.url?.includes('notConnection.html?blockedIp');
              
              if (!isClienBlocked) {
                communityResults = results;
                break;
              }
              console.warn(`커뮤니티 정보 가져오기 시도 ${attempt}/${maxRetries} - 클리앙 차단 패턴 감지`);
            }
          } catch (error) {
            console.error(`커뮤니티 정보 가져오기 시도 ${attempt}/${maxRetries} 실패:`, error);
          }

          // 마지막 시도가 아니면 1초 대기
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!communityResults) {
          throw new Error('커뮤니티 정보를 가져올 수 없습니다. 나중에 다시 시도해주세요.');
        }

        title = communityResults.title;
        metadata = communityResults;
      }
      await upsertPlaceFeatureMutation.mutateAsync({
        p_business_id: placeId!, p_platform_type: platform, p_content_url: url, p_title: title, p_metadata: metadata
      });
      if (platform === 'youtube') { setYoutubeUrlInput(''); setShowYoutubeAddForm(false); }
      else { setCommunityUrlInput(''); setShowCommunityAddForm(false); }
    } catch (e: any) { alert(e.message); }
    finally { 
      setIsRequestProcessing(false);
      setRetryCount(0);
    }
  };

  const handleDeleteFeature = async () => {
    if (!showDeleteFeatureConfirm) return;
    try {
      await deletePlaceFeatureMutation.mutateAsync(showDeleteFeatureConfirm);
      setShowDeleteFeatureConfirm(null);
    } catch (e: any) { alert(e.message); }
  };

  const getPlatformName = (domain: string) => {
    const names: Record<string, string> = { 'damoang.net': '다모앙', 'clien.net': '클리앙', 'bobaedream.co.kr': '보배드림', 'youtube': '유튜브' };
    return names[domain] || domain;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" />
      
      <div className={cn(
        "relative w-full h-full bg-white dark:bg-surface-950 flex flex-col",
        "md:max-w-md md:h-[90vh] md:rounded-[24px] md:overflow-hidden"
      )}>
        <header className="flex h-14 items-center px-4 border-b border-surface-100 dark:border-surface-800 shrink-0 bg-white dark:bg-surface-900">
          <button onClick={handleClose} className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-50">
            <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
          </button>
          <h1 className="ml-3 text-lg font-bold text-surface-900 dark:text-surface-50 truncate flex-1">
            {details?.name || "장소 상세"}
          </h1>
          <button 
            onClick={() => navigator.share && navigator.share({ title: details?.name, url: window.location.href })} 
            className="p-2 text-surface-400"
          >
            <Share2 className="size-5" />
          </button>
        </header>

        <div 
          className="flex-1 overflow-y-auto pb-safe scrollbar-hide"
          style={{ willChange: 'scroll-position', WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)' }}
        >
          {showLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="size-8 animate-spin text-primary-500" />
            </div>
          ) : (
          <>
            <div className="relative w-full bg-surface-100 dark:bg-surface-900">
              {allImages.length > 0 ? (
                <>
                  <div 
                    ref={imageSliderRef}
                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                    style={{ willChange: 'scroll-position', WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)' }}
                  >
                    {allImages.slice(0, 10).map((img, index) => (
                      <div key={index} className="flex-shrink-0 w-full aspect-[4/3] snap-center bg-surface-100">
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

                  <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2">
                    {details?.avg_price && details.avg_price > 0 && (
                      <div className="bg-black/70 px-3 py-1.5 rounded-full">
                        <span className="text-[13px] font-bold text-white">
                          {formatWithCommas(details.avg_price, '-', true)}원대
                        </span>
                      </div>
                    )}
                  </div>

                  {allImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 px-2.5 py-1.5 rounded-full">
                      {allImages.slice(0, 10).map((_, index) => (
                        <div key={index} className={cn("rounded-full", currentImageIndex === index ? "w-4 h-1 bg-white" : "w-1 h-1 bg-white/40")} />
                      ))}
                    </div>
                  )}

                  {details?.experience?.is_visited && (
                    <div className="absolute bottom-4 right-4 bg-primary-600 text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
                      다녀왔어요
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[4/3] flex flex-col items-center justify-center bg-surface-50">
                  <Globe className="size-12 text-surface-200" />
                </div>
              )}
            </div>

            <div className="px-4 pt-4 pb-4 border-b border-surface-50">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h1 className="text-2xl font-black text-surface-900 dark:text-white truncate">{details?.name}</h1>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="font-medium text-surface-500">{details?.group2} {details?.group3}</span>
                    <span className="text-surface-200">|</span>
                    <div className="flex items-center gap-0.5 font-bold text-amber-500">
                      <Star className="size-4 fill-current" />
                      {details?.visitor_reviews_score?.toFixed(1) || "0.0"}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={handleToggleLike} className="p-2 active:opacity-60 transition-opacity">
                    <Heart className={cn(
                      "size-6", 
                      details?.interaction?.is_liked 
                        ? "fill-rose-500 text-rose-500" 
                        : "text-surface-700 dark:text-surface-300"
                    )} />
                  </button>
                  <button onClick={handleToggleSave} className="p-2 active:opacity-60 transition-opacity">
                    <Bookmark className={cn(
                      "size-6", 
                      details?.interaction?.is_saved 
                        ? "fill-amber-500 text-amber-500" 
                        : "text-surface-700 dark:text-surface-300"
                    )} />
                  </button>
                  <button 
                    onClick={() => isAuthenticated ? setShowFolderModal(true) : alert('로그인이 필요합니다.')}
                    className="p-2 active:opacity-60 transition-opacity"
                  >
                    <Folder className={cn(
                      "size-6", 
                      isSavedToAnyFolder 
                        ? "fill-emerald-500 text-emerald-500" 
                        : "text-surface-700 dark:text-surface-300"
                    )} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6 px-1">
                <a 
                  href={`https://map.naver.com/p/entry/place/${placeId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400 text-[13px] font-bold"
                >
                  <MapPin className="size-4" /> 네이버 지도
                </a>
                <button 
                  onClick={() => document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400 text-[13px] font-bold"
                >
                  <MessageCircle className="size-4" /> 리뷰 {details?.interaction?.place_reviews_count || 0}
                </button>
              </div>

              {/* 방문 기록 영역 */}
              <div className="mb-4">
                {visitStats && visitStats.visit_count > 0 ? (
                  <button
                    onClick={() => setShowVisitHistoryModal(true)}
                    className="w-full flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-950/30 rounded-2xl border border-primary-100 dark:border-primary-900/50 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary-500 flex items-center justify-center shadow-sm shadow-primary-200">
                        <MapPinCheck className="size-5 text-white" />
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[16px] font-black text-primary-900 dark:text-primary-100">
                            {visitStats.visit_count}회 방문
                          </span>
                        </div>
                        <span className="text-[12px] text-primary-600/70 dark:text-primary-400">
                          마지막 방문 {safeFormatDate(visitStats.last_visited_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-primary-400" />
                  </button>
                ) : (
                  <button
                    onClick={() => isAuthenticated ? setShowVisitHistoryModal(true) : alert('로그인이 필요합니다.')}
                    className="w-full flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-white dark:bg-surface-800 flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-700">
                        <MapPin className="size-5 text-surface-400" />
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[15px] font-bold text-surface-900 dark:text-surface-100">여기 다녀오셨나요?</span>
                        <span className="text-[12px] text-surface-500">나만의 방문 기록을 남겨보세요</span>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-surface-900 dark:bg-white rounded-xl">
                      <span className="text-[12px] font-bold text-white dark:text-surface-900">다녀왔어요!</span>
                    </div>
                  </button>
                )}
              </div>

              {folderFeatures.length > 0 && (
                <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
                  {folderFeatures.map(folder => (
                    <button 
                      key={folder.id}
                      className="flex-shrink-0 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[12px] font-bold rounded-full"
                      onClick={() => navigate(`/folder/${folder.id}`)}
                    >
                      📁 {folder.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 space-y-8">
              {/* {details?.road && (
                <div className="p-4 bg-surface-50 dark:bg-surface-900 rounded-xl">
                  <p className="text-[14px] leading-relaxed text-surface-600 dark:text-surface-400 whitespace-pre-line">{details.road}</p>
                </div>
              )} */}

              <section id="review-section" className="py-2">
                <div className="flex items-center justify-between px-4 mb-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    방문 리뷰 <span className="text-primary-500">{publicReviews.length}</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowAllReviews(!showAllReviews)} 
                      className="text-[13px] font-bold text-primary-600"
                    >
                      {showAllReviews ? "접기" : `전체보기 (${publicReviews.length})`}
                    </button>
                    {!showReviewForm && (
                      <button 
                        onClick={() => isAuthenticated ? setShowReviewForm(true) : alert('로그인이 필요합니다.')}
                        className="text-[12px] font-bold text-primary-600 px-3 py-1.5 bg-primary-50 rounded-lg active:scale-95 transition-transform"
                      >
                        리뷰쓰기
                      </button>
                    )}
                  </div>
                </div>
                
                {showReviewForm && (
                  <div className="mx-4 mb-6 p-4 rounded-xl border border-primary-100 bg-primary-50/30 space-y-4">
                    <div className="flex justify-between px-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)} className="active:scale-90 transition-transform">
                          <Star className={cn("size-8", s <= rating ? "text-amber-400 fill-current" : "text-surface-200")} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="이 장소에 대한 솔직한 평을 남겨주세요."
                      className="w-full h-24 p-3 rounded-lg bg-white border-none resize-none text-[13px] focus:ring-1 focus:ring-primary-500"
                      maxLength={200}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map(tag => (
                        <button
                          key={tag.code}
                          onClick={() => toggleTag(tag.code)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold",
                            selectedTagCodes.includes(tag.code) ? "bg-primary-600 text-white" : "bg-white text-surface-400 border border-surface-100"
                          )}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button 
                        onClick={() => setIsPrivate(!isPrivate)}
                        className={cn(
                          "flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors",
                          isPrivate ? "bg-surface-900 text-white" : "text-surface-400 hover:bg-surface-100"
                        )}
                      >
                        {isPrivate ? <Lock className="size-3.5 fill-current" /> : <Lock className="size-3.5" />}
                        {isPrivate ? "나만 보기 (비공개)" : "전체 공개"}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={resetReviewForm} className="flex-1 h-10 text-[13px] font-bold">취소</Button>
                      <Button onClick={handleSaveReview} className="flex-1 h-10 text-[13px] font-bold bg-primary-600 text-white">기록 완료</Button>
                    </div>
                  </div>
                )}
                
                {publicReviews.length > 0 ? (
                  showAllReviews ? (
                    <div className="space-y-3 px-4">
                      {publicReviews.map(review => (
                        <article key={review.id} className="p-4 rounded-xl border border-surface-100 bg-white dark:bg-surface-900 shadow-sm">
                          {editingReviewId === review.id ? (
                            <div className="space-y-4">
                              <div className="flex justify-between px-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button key={s} onClick={() => setEditingRating(s)} className="active:scale-90 transition-transform">
                                    <Star className={cn("size-8", s <= editingRating ? "text-amber-400 fill-current" : "text-surface-200")} />
                                  </button>
                                ))}
                              </div>
                              <textarea
                                value={editingComment}
                                onChange={(e) => setEditingComment(e.target.value)}
                                className="w-full h-24 p-3 rounded-lg bg-surface-50 border-none resize-none text-[13px] focus:ring-1 focus:ring-primary-500"
                                maxLength={200}
                              />
                              <div className="flex flex-wrap gap-1.5">
                                {availableTags.map(tag => (
                                  <button
                                    key={tag.code}
                                    onClick={() => toggleEditTag(tag.code)}
                                    className={cn(
                                      "px-2.5 py-1 rounded-full text-[10px] font-bold",
                                      editingTagCodes.includes(tag.code) ? "bg-primary-600 text-white" : "bg-white text-surface-400 border border-surface-100"
                                    )}
                                  >
                                    {tag.label}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                <button 
                                  onClick={() => setEditingIsPrivate(!editingIsPrivate)}
                                  className={cn(
                                    "flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors",
                                    editingIsPrivate ? "bg-surface-900 text-white" : "text-surface-400 hover:bg-surface-100"
                                  )}
                                >
                                  {editingIsPrivate ? <Lock className="size-3.5 fill-current" /> : <Lock className="size-3.5" />}
                                  {editingIsPrivate ? "나만 보기 (비공개)" : "전체 공개"}
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setEditingReviewId(null)} className="flex-1 h-10 text-[13px] font-bold">취소</Button>
                                <Button onClick={() => handleSaveEditReview(review.id)} className="flex-1 h-10 text-[13px] font-bold bg-primary-600 text-white">수정 완료</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <img 
                                src={review.user_profile?.profile_image_url || "/default-avatar.png"} 
                                className="size-8 rounded-full bg-surface-100"
                                loading="lazy" decoding="async"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-bold text-[13px] truncate">{review.user_profile?.nickname || "익명"}</span>
                                    {review.is_private && <Lock className="size-3 text-surface-400 fill-current" />}
                                  </div>
                                  <span className="text-[11px] text-surface-400 shrink-0">{safeFormatDate(review.created_at)}</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-0.5 text-amber-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} className={cn("size-3", i < review.score ? "fill-current" : "text-surface-100")} />)}
                                  </div>
                                  {review.is_my_review && (
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => handleStartEditReview(review)} className="p-1 text-surface-400 hover:text-primary-500">
                                        <Pencil className="size-3.5" />
                                      </button>
                                      <button onClick={() => setShowDeleteReviewConfirm(review.id)} className="p-1 text-surface-400 hover:text-rose-500">
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-[13px] text-surface-600 dark:text-surface-400 leading-relaxed">{review.review_content}</p>
                                {review.tags && review.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {review.tags.map(tag => (
                                      <span key={tag.code} className="text-[10px] text-surface-400 bg-surface-50 px-1.5 py-0.5 rounded">
                                        {tag.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
                      {publicReviews.slice(0, 5).map(review => (
                        <article key={review.id} className="flex-shrink-0 w-72 p-4 rounded-xl border border-surface-100 bg-white dark:bg-surface-900 shadow-sm">
                          <div className="flex gap-3 mb-2">
                            <img 
                              src={review.user_profile?.profile_image_url || "/default-avatar.png"} 
                              className="size-8 rounded-full bg-surface-100"
                              loading="lazy" decoding="async"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[13px] truncate">{review.user_profile?.nickname || "익명"}</span>
                                <span className="text-[11px] text-surface-400 shrink-0">{safeFormatDate(review.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-0.5 text-amber-400">
                                {[...Array(5)].map((_, i) => <Star key={i} className={cn("size-2.5", i < review.score ? "fill-current" : "text-surface-100")} />)}
                              </div>
                            </div>
                          </div>
                          <p className="text-[13px] text-surface-600 dark:text-surface-400 leading-relaxed line-clamp-2 h-10">{review.review_content}</p>
                          {review.tags && review.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {review.tags.slice(0, 2).map(tag => (
                                <span key={tag.code} className="text-[10px] text-surface-400 bg-surface-50 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                  {tag.label}
                                </span>
                              ))}
                              {review.tags.length > 2 && <span className="text-[10px] text-surface-300">+{review.tags.length - 2}</span>}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="mx-4 py-8 text-center bg-surface-50 dark:bg-surface-900/50 rounded-xl border border-dashed border-surface-200 dark:border-surface-800">
                    <p className="text-sm text-surface-400">첫 번째 리뷰를 남겨주세요</p>
                  </div>
                )}
              </section>

              {details?.menus && details.menus.length > 0 && (
                <section className="py-2">
                  <div className="flex items-center justify-between px-4 mb-3">
                    <h3 className="text-lg font-bold">메뉴</h3>
                    <button 
                      onClick={() => setShowAllMenus(!showAllMenus)} 
                      className="text-[13px] font-bold text-primary-600"
                    >
                      {showAllMenus ? "접기" : `전체보기 (${details.menus.length})`}
                    </button>
                  </div>
                  
                  {showAllMenus ? (
                    <div className="grid grid-cols-3 gap-3 px-4">
                      {details.menus.map((menu: any, index: number) => {
                        const menuImage = menu.image || menu.images?.[0];
                        const menuName = menu.text || menu.name || '메뉴명 없음';
                        const menuPrice = menu.price || '';
                        
                        return (
                          <div
                            key={index}
                            className="flex flex-col rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden"
                          >
                            <div className="relative aspect-square w-full bg-surface-50 dark:bg-surface-800">
                              {menuImage ? (
                                <img
                                  src={convertToNaverResizeImageUrl(menuImage)}
                                  alt={menuName}
                                  className="h-full w-full object-cover"
                                  loading="lazy" decoding="async"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full text-surface-200">
                                  <CookingPot className="size-5 mb-1" />
                                  <span className="text-[8px]">NO IMAGE</span>
                                </div>
                              )}
                              {menu.recommend && (
                                <div className="absolute top-1 left-1 bg-amber-400 px-1 py-0.5 rounded text-[9px] font-bold text-white shadow-sm">
                                  대표
                                </div>
                              )}
                            </div>
                            <div className="p-2 flex-1 flex flex-col justify-center">
                              <h4 className="text-[11px] font-bold text-surface-900 dark:text-surface-100 line-clamp-2 text-center">
                                {menuName}
                              </h4>
                              {menuPrice && (
                                <p className="text-[10px] text-surface-500 mt-0.5 text-center">
                                  {typeof menuPrice === 'number' 
                                    ? formatWithCommas(menuPrice, ',', false) + '원'
                                    : menuPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원'
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
                      {details.menus.map((menu: any, index: number) => {
                        const menuImage = menu.image || menu.images?.[0];
                        const menuName = menu.text || menu.name || '메뉴명 없음';
                        const menuPrice = menu.price || '';
                        
                        return (
                          <div
                            key={index}
                            className="flex-shrink-0 w-32 flex flex-col rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden shadow-sm"
                          >
                            <div className="relative h-24 w-full bg-surface-50 dark:bg-surface-800">
                              {menuImage ? (
                                <img
                                  src={convertToNaverResizeImageUrl(menuImage)}
                                  alt={menuName}
                                  className="h-full w-full object-cover"
                                  loading="lazy" decoding="async"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full text-surface-200">
                                  <CookingPot className="size-6 mb-1" />
                                  <span className="text-[9px]">NO IMAGE</span>
                                </div>
                              )}
                              {menu.recommend && (
                                <div className="absolute top-1.5 left-1.5 bg-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm">
                                  대표
                                </div>
                              )}
                            </div>
                            <div className="p-2 flex-1 flex flex-col justify-between">
                              <h4 className="text-[12px] font-bold text-surface-900 dark:text-surface-100 line-clamp-1">
                                {menuName}
                              </h4>
                              {menuPrice && (
                                <p className="text-[11px] text-surface-500 mt-0.5">
                                  {typeof menuPrice === 'number' 
                                    ? formatWithCommas(menuPrice, ',', false) + '원'
                                    : menuPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원'
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              <section className="bg-surface-50 dark:bg-surface-950/50 -mx-4 px-4 py-8 relative">
                {isRequestProcessing && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface-50/80 dark:bg-surface-900/80">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="size-6 animate-spin text-primary-600" />
                      <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                        {retryCount > 0 ? `처리중... ${retryCount}/${maxRetries}` : '처리중...'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">🔗 관련 콘텐츠</h3>
                  <div className="flex bg-surface-100 dark:bg-surface-900 p-0.5 rounded-lg">
                    <button 
                      onClick={() => setActiveContentTab('youtube')}
                      className={cn(
                        "px-3 py-1 rounded-md text-[12px] font-bold transition-all", 
                        activeContentTab === 'youtube' ? "bg-white dark:bg-surface-800 text-red-600 shadow-sm" : "text-surface-400"
                      )}
                    >유튜브 {youtubeFeatures.length}</button>
                    <button 
                      onClick={() => setActiveContentTab('community')}
                      className={cn(
                        "px-3 py-1 rounded-md text-[12px] font-bold transition-all", 
                        activeContentTab === 'community' ? "bg-white dark:bg-surface-800 text-blue-600 shadow-sm" : "text-surface-400"
                      )}
                    >커뮤니티 {communityFeatures.length}</button>
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="mb-4">
                    {(activeContentTab === 'youtube' ? showYoutubeAddForm : showCommunityAddForm) ? (
                      <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 space-y-3">
                        <Input 
                          placeholder="링크를 입력하세요" 
                          value={activeContentTab === 'youtube' ? youtubeUrlInput : communityUrlInput}
                          onChange={(e) => activeContentTab === 'youtube' ? setYoutubeUrlInput(e.target.value) : setCommunityUrlInput(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button variant="ghost" className="flex-1" onClick={() => activeContentTab === 'youtube' ? setShowYoutubeAddForm(false) : setShowCommunityAddForm(false)}>취소</Button>
                          <Button className="flex-1" onClick={() => handleAddFeature(activeContentTab)} disabled={isRequestProcessing}>추가</Button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => activeContentTab === 'youtube' ? setShowYoutubeAddForm(true) : setShowCommunityAddForm(true)}
                        className="w-full py-3 border border-dashed border-surface-300 dark:border-surface-700 rounded-xl text-surface-400 text-[13px] font-bold hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors"
                      >+ 링크 추가</button>
                    )}
                  </div>
                )}

                <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
                  {activeContentTab === 'youtube' ? (
                    youtubeFeatures.length > 0 ? (
                      youtubeFeatures.map(feature => (
                        <a key={feature.id} href={feature.content_url} target="_blank" rel="noreferrer" className="flex-shrink-0 w-64 bg-white dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-100 dark:border-surface-800 shadow-sm">
                          <div className="aspect-video relative">
                            <img src={feature.metadata?.thumbnails?.medium?.url} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                              <div className="size-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent ml-1" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="text-[13px] font-bold line-clamp-1 dark:text-surface-100">{feature.title}</h4>
                            <p className="text-[11px] text-surface-400 mt-1">{feature.metadata?.channelTitle}</p>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="w-full py-8 text-center text-surface-400 text-sm">관련 영상이 없습니다.</div>
                    )
                  ) : (
                    communityFeatures.length > 0 ? (
                      communityFeatures.map(feature => (
                        <a key={feature.id} href={feature.content_url} target="_blank" rel="noreferrer" className="flex-shrink-0 w-64 flex items-center gap-3 p-3 bg-white dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800 shadow-sm">
                          <div className="size-10 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                            <Globe className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold truncate dark:text-surface-100">{feature.title}</h4>
                            <span className="text-[10px] text-blue-500 font-bold">{getPlatformName(feature.metadata?.domain)}</span>
                          </div>
                          <ExternalLink className="size-4 text-surface-200" />
                        </a>
                      ))
                    ) : (
                      <div className="w-full py-8 text-center text-surface-400 text-sm">관련 커뮤니티 글이 없습니다.</div>
                    )
                  )}
                </div>
              </section>
            </div>
          </>
          )}
        </div>
      </div>

      <Dialog open={!!showDeleteReviewConfirm} onOpenChange={(open) => !open && setShowDeleteReviewConfirm(null)}>
        <DialogContent className="rounded-2xl max-w-[320px]">
          <DialogTitle className="text-center font-bold">리뷰 삭제</DialogTitle>
          <p className="text-center text-sm text-surface-500">정말로 삭제하시겠습니까?</p>
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteReviewConfirm(null)}>취소</Button>
            <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={handleDeleteReview}>삭제</Button>
          </div>
        </DialogContent>
      </Dialog>

      {showFolderModal && <FolderSelectionModal placeId={placeId!} onClose={() => setShowFolderModal(false)} onCloseAll={handleClose} />}
      
      {showVisitHistoryModal && (
        <VisitHistoryModal 
          placeId={placeId!} 
          placeName={details?.name || ""} 
          onClose={() => setShowVisitHistoryModal(false)} 
        />
      )}
    </div>,
    document.body
  );
}
