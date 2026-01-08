import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router";
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
  Share2,
  CheckCircle2,
  Heart,
  Bookmark,
  ChevronRight,
  CookingPot
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
export function PlaceDetailModal() {
  const navigate = useNavigate();
  const { id: placeId } = useParams<{ id: string }>();
  const { profile: currentUser, isAuthenticated } = useUserStore();

  const { data: details, isLoading: isDetailsLoading } = usePlaceByIdWithRecentView(placeId!);
  const { data: reviews = [], isLoading: isReviewsLoading } = usePlaceUserReviews(placeId!);
  const { data: placeFeaturesData = [], isLoading: isFeaturesLoading } = usePlaceFeatures(placeId!);

  const upsertReviewMutation = useUpsertUserReview();
  const deleteReviewMutation = useDeleteUserReview(placeId!);
  const upsertPlaceFeatureMutation = useUpsertPlaceFeature();
  const deletePlaceFeatureMutation = useDeletePlaceFeature(placeId!);
  const toggleLikeMutation = useToggleLike();
  const toggleSaveMutation = useToggleSave();
  const toggleVisitedMutation = useToggleVisited();

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

  const [selectedHeroImage, setSelectedHeroImage] = useState<string | null>(null);

  useEffect(() => {
    if (allImages.length > 0 && !selectedHeroImage) {
      setSelectedHeroImage(allImages[0]);
    }
  }, [allImages, selectedHeroImage]);

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
    navigate(-1);
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
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
          {/* Hero 섹션 */}
          <div className="relative w-full h-[380px] bg-surface-100 dark:bg-surface-900 overflow-hidden">
            {selectedHeroImage ? (
              <img 
                src={convertToNaverResizeImageUrl(selectedHeroImage)} 
                alt={details?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-surface-300">
                <Globe className="size-12 opacity-20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase">
                      {details?.category || "장소"}
                    </span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight mb-2 truncate drop-shadow-lg text-white">
                    {details?.name || "장소 정보"}
                  </h1>
                  {details?.road_address && (
                    <div className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
                      <MapPin className="size-3.5" />
                      <span className="truncate">{details.road_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 썸네일 리스트 */}
              {allImages.length > 1 && (
                <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {allImages.slice(0, 8).map((img, i) => (
                    <button 
                      key={i}
                      onClick={() => setSelectedHeroImage(img)}
                      className={cn(
                        "size-14 rounded-xl overflow-hidden shrink-0 border-2",
                        selectedHeroImage === img ? "border-white shadow-lg" : "border-transparent opacity-60"
                      )}
                    >
                      <img src={convertToNaverResizeImageUrl(img)} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* 상호작용 버튼 */}
            <div className="flex justify-center gap-3 mb-10">
              <button
                onClick={handleToggleVisited}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold",
                  details?.experience?.is_visited
                    ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100"
                    : "bg-white dark:bg-surface-900 text-surface-600 border-surface-200 dark:border-surface-800"
                )}
              >
                <CheckCircle2 className={cn("size-4", details?.experience?.is_visited && "fill-current text-white")} />
                가봤어요
              </button>
              <button
                onClick={handleToggleLike}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold",
                  details?.interaction?.is_liked
                    ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-100"
                    : "bg-white dark:bg-surface-900 text-surface-600 border-surface-200 dark:border-surface-800"
                )}
              >
                <Heart className={cn("size-4", details?.interaction?.is_liked && "fill-current")} />
                좋아요
              </button>
              <button
                onClick={handleToggleSave}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold",
                  details?.interaction?.is_saved
                    ? "bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-100"
                    : "bg-white dark:bg-surface-900 text-surface-600 border-surface-200 dark:border-surface-800"
                )}
              >
                <Bookmark className={cn("size-4", details?.interaction?.is_saved && "fill-current")} />
                저장
              </button>
            </div>

            {/* 출처/폴더 태그 */}
            {folderFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-10">
                {folderFeatures.map(folder => (
                  <div 
                    key={folder.id} 
                    className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-bold text-xs"
                  >
                    #{folder.title}
                  </div>
                ))}
              </div>
            )}

            {/* 장소 정보 요약 */}
            <div className="flex flex-col gap-6 mb-10">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-primary-600">
                      {details?.visitor_reviews_score?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">평점</span>
                  </div>
                  <div className="w-px h-8 bg-surface-100 dark:bg-surface-800 self-center" />
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-surface-900 dark:text-white">
                      {details?.visitor_reviews_total || 0}
                    </span>
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">리뷰</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a 
                    href={`https://map.naver.com/p/entry/place/${placeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center p-2 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-900"
                  >
                    <div className="size-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-1">
                      <ExternalLink className="size-5" />
                    </div>
                    <span className="text-[10px] font-bold text-surface-500">네이버</span>
                  </a>
                </div>
              </div>

              {details?.road && (
                <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900">
                  <p className="text-sm font-medium leading-relaxed text-surface-600 dark:text-surface-400 whitespace-pre-line">
                    {details.road}
                  </p>
                </div>
              )}
            </div>

            {/* 메뉴 섹션 */}
            {details?.menus && details.menus.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6 px-1">
                  <h3 className="text-xl font-black tracking-tight text-surface-900 dark:text-white">메뉴</h3>
                  <span className="text-xs font-bold text-surface-400">총 {details.menus.length}개</span>
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
                          <div className="w-full h-full flex items-center justify-center text-surface-200">
                            <CookingPot className="size-8 opacity-20" />
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
              <div className="mb-10 p-5 rounded-3xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-between gap-4">
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
              <div className="mb-10 p-6 rounded-3xl border-2 border-primary-100 dark:border-primary-900/30 bg-white dark:bg-surface-950 shadow-xl shadow-primary-100/50 dark:shadow-none">
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

            <div className="space-y-12">
              {/* 리뷰 목록 */}
              <div className="space-y-6">
                <div className="flex items-end justify-between px-1">
                  <h3 className="text-2xl font-black tracking-tight text-surface-900 dark:text-white">
                    전체 리뷰 <span className="text-primary-600 ml-1">{publicReviews.length}</span>
                  </h3>
                </div>
                
                {publicReviews.length > 0 ? (
                  <div className="space-y-4">
                    {displayedReviews.map(review => (
                      <article key={review.id} className="p-5 rounded-[24px] bg-white dark:bg-surface-900 border border-surface-50 dark:border-surface-800 shadow-sm">
                        <div className="flex gap-4">
                          <img 
                            src={review.user_profile?.profile_image_url || "/default-avatar.png"} 
                            className="size-10 rounded-full bg-surface-100 shrink-0 object-cover ring-2 ring-white dark:ring-surface-800 shadow-sm" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/default-avatar.png";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-[14px] text-surface-900 dark:text-white truncate">
                                    {review.user_profile?.nickname || "익명"}
                                  </span>
                                  {review.is_private && <Lock className="size-3 text-surface-300" />}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex text-yellow-400 scale-90 -ml-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={cn("size-3 fill-current", i >= review.score && "text-surface-100 dark:text-surface-800")} />
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-surface-300 font-bold uppercase tracking-wider">
                                    {safeFormatDate(review.created_at)}
                                  </span>
                                </div>
                              </div>
                              
                              {review.is_my_review && !editingReviewId && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleStartEditReview(review)} className="p-2 text-surface-300 hover:text-surface-900 hover:bg-surface-50 rounded-lg">
                                    <Pencil className="size-3.5" />
                                  </button>
                                  <button onClick={() => setShowDeleteReviewConfirm(review.id)} className="p-2 text-surface-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {editingReviewId === review.id ? (
                              <div className="space-y-4 p-4 rounded-2xl bg-surface-50 dark:bg-surface-900">
                                <div className="flex gap-1">
                                  {[1,2,3,4,5].map(s => (
                                    <button key={s} onClick={() => setEditingRating(s)}>
                                      <Star className={cn("size-6", s <= editingRating ? "text-yellow-400 fill-current" : "text-surface-200")} />
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  value={editingComment}
                                  onChange={(e) => setEditingComment(e.target.value)}
                                  className="w-full p-4 rounded-xl bg-white dark:bg-surface-800 border-none resize-none font-medium text-sm text-surface-700 dark:text-surface-300"
                                  rows={3}
                                />
                                <div className="flex flex-wrap gap-1.5">
                                  {availableTags.map(tag => (
                                    <button
                                      key={tag.code}
                                      onClick={() => toggleEditTag(tag.code)}
                                      className={cn(
                                        "px-3 py-1.5 rounded-full text-[10px] font-black border",
                                        editingTagCodes.includes(tag.code) 
                                          ? "bg-primary-600 text-white border-primary-600" 
                                          : "bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 text-surface-400"
                                      )}
                                    >
                                      {tag.label}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingReviewId(null)} className="font-bold text-surface-400">취소</Button>
                                  <Button size="sm" onClick={() => handleSaveEditReview(review.id)} className="font-bold">저장</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-[14px] leading-relaxed font-medium text-surface-600 dark:text-surface-400 mb-3">{review.review_content}</p>
                                {review.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {review.tags.map(tag => (
                                      <span key={tag.code} className="px-2.5 py-1 rounded-lg bg-primary-50/50 dark:bg-primary-950/20 text-[10px] font-black text-primary-600/80 tracking-tight">
                                        #{tag.label}
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
                  <div className="py-20 flex flex-col items-center justify-center gap-4 bg-surface-50 dark:bg-surface-900 rounded-[32px] text-surface-200">
                    <Star className="size-12 opacity-10" />
                    <p className="text-sm font-black">첫 번째 리뷰를 남겨주세요</p>
                  </div>
                )}

                {publicReviews.length > 3 && !showAllReviews && (
                  <button 
                    onClick={() => setShowAllReviews(true)} 
                    className="w-full h-14 rounded-2xl font-black text-[13px] text-surface-400 bg-surface-50 dark:bg-surface-900 hover:bg-surface-100"
                  >
                    리뷰 더보기 <span className="text-primary-600 ml-1">{publicReviews.length - 3}</span>
                  </button>
                )}
              </div>

              {/* 관련 콘텐츠 */}
              <div className="space-y-6">
                <h3 className="text-2xl font-black tracking-tight text-surface-900 dark:text-white px-1">관련 콘텐츠</h3>
                
                <div className="w-full bg-surface-50 dark:bg-surface-900 p-1.5 rounded-2xl flex gap-1">
                  <button 
                    onClick={() => setActiveContentTab('youtube')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black tracking-wider uppercase",
                      activeContentTab === 'youtube' ? "bg-white dark:bg-surface-800 shadow-sm text-primary-600" : "text-surface-300"
                    )}
                  >
                    YouTube ({youtubeFeatures.length})
                  </button>
                  <button 
                    onClick={() => setActiveContentTab('community')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black tracking-wider uppercase",
                      activeContentTab === 'community' ? "bg-white dark:bg-surface-800 shadow-sm text-primary-600" : "text-surface-300"
                    )}
                  >
                    커뮤니티 ({communityFeatures.length})
                  </button>
                </div>

                <div className="space-y-4">
                  {isAuthenticated && (
                    <button
                      onClick={() => activeContentTab === 'youtube' ? setShowYoutubeAddForm(!showYoutubeAddForm) : setShowCommunityAddForm(!showCommunityAddForm)}
                      className="w-full p-4 rounded-2xl border-2 border-dashed border-surface-100 dark:border-surface-800 text-[13px] font-black text-surface-300 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/10 flex items-center justify-center gap-2"
                    >
                      <Plus className="size-4" />
                      링크 추가하기
                    </button>
                  )}

                  {(showYoutubeAddForm || showCommunityAddForm) && (
                    <div className="p-5 rounded-2xl bg-surface-50 dark:bg-surface-900 space-y-4 border-2 border-primary-100 dark:border-primary-900/30 shadow-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn("size-2 rounded-full", activeContentTab === 'youtube' ? "bg-red-500" : "bg-blue-500")} />
                        <span className="text-[10px] font-black tracking-widest uppercase text-surface-400">
                          {activeContentTab === 'youtube' ? "YouTube Link" : "Community Link"}
                        </span>
                      </div>
                      <Input 
                        placeholder={activeContentTab === 'youtube' ? "https://youtube.com/..." : "https://clien.net/..."}
                        value={activeContentTab === 'youtube' ? youtubeUrlInput : communityUrlInput}
                        onChange={(e) => activeContentTab === 'youtube' ? setYoutubeUrlInput(e.target.value) : setCommunityUrlInput(e.target.value)}
                        className="h-12 rounded-xl border-none bg-white dark:bg-surface-800 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => activeContentTab === 'youtube' ? setShowYoutubeAddForm(false) : setShowCommunityAddForm(false)} className="flex-1 font-bold text-surface-400">취소</Button>
                        <Button size="sm" onClick={() => handleAddFeature(activeContentTab)} disabled={isRequestProcessing} className="flex-[2] font-black">
                          {isRequestProcessing ? <Loader2 className="size-4 animate-spin" /> : "추가하기"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeContentTab === 'youtube' ? (
                    youtubeFeatures.length > 0 ? (
                      <div className="space-y-3">
                        {youtubeFeatures.map(feature => (
                          <div key={feature.id} className="group relative flex items-start gap-4 p-3 rounded-2xl bg-white dark:bg-surface-900 border border-surface-50 dark:border-surface-800">
                            <div className="relative w-28 aspect-video rounded-xl overflow-hidden shrink-0 shadow-sm">
                              <img src={feature.metadata?.thumbnails?.medium?.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Youtube className="size-8 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <a href={feature.content_url} target="_blank" rel="noreferrer" className="block text-sm font-black line-clamp-2 leading-snug hover:text-primary-600">
                                {feature.title}
                              </a>
                              <div className="mt-2 flex items-center gap-2">
                                <div className="size-4 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                                  <Youtube className="size-2.5" />
                                </div>
                                <span className="text-[11px] text-surface-400 font-bold truncate">
                                  {feature.metadata?.channelTitle}
                                </span>
                              </div>
                            </div>
                            {feature.user_id === currentUser?.auth_user_id && (
                              <button onClick={() => setShowDeleteFeatureConfirm(feature.id)} className="p-2 opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 bg-red-500 text-white rounded-full shadow-lg">
                                <X className="size-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 flex flex-col items-center justify-center gap-4 bg-surface-50 dark:bg-surface-900 rounded-[32px] text-surface-200">
                        <Youtube className="size-12 opacity-10" />
                        <p className="text-sm font-black">관련 영상이 없습니다</p>
                      </div>
                    )
                  ) : (
                    communityFeatures.length > 0 ? (
                      <div className="space-y-3">
                        {communityFeatures.map(feature => (
                          <div key={feature.id} className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-50 dark:border-surface-800">
                            <div className="size-12 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center shrink-0">
                              <Globe className="size-6 text-surface-200" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <a href={feature.content_url} target="_blank" rel="noreferrer" className="block text-sm font-black truncate hover:text-primary-600">
                                {feature.title}
                              </a>
                              <p className="text-[11px] text-surface-400 font-bold mt-1 tracking-tight">
                                {getPlatformName(feature.metadata?.domain)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <a href={feature.content_url} target="_blank" rel="noreferrer" className="p-2 text-surface-200 hover:text-primary-600 hover:bg-primary-50 rounded-xl">
                                <ExternalLink className="size-4" />
                              </a>
                              {feature.user_id === currentUser?.auth_user_id && (
                                <button onClick={() => setShowDeleteFeatureConfirm(feature.id)} className="p-2 text-surface-200 hover:text-red-500 hover:bg-red-50 rounded-xl">
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 flex flex-col items-center justify-center gap-4 bg-surface-50 dark:bg-surface-900 rounded-[32px] text-surface-200">
                        <Globe className="size-12 opacity-10" />
                        <p className="text-sm font-black">관련 게시글이 없습니다</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
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
    </div>,
    document.body
  );
}
