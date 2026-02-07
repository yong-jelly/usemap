import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router";
import { usePlacePopup } from "@/shared/lib/place-popup";
import { 
  ChevronLeft,
  X, 
  Star, 
  Plus, 
  Loader2,
  Youtube,
  Globe,
  MapPin,
  MapPinCheck,
  Share2,
  Trash2,
  Heart,
  Bookmark,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Folder,
  MessageCircle,
  Users,
  Utensils,
  Smile,
  Sparkle,
  Clock,
  Car,
  ThumbsUp,
  Map
} from "lucide-react";
import { 
  usePlaceByIdWithRecentView, 
  usePlaceUserReviews, 
  usePlaceFeatures,
  useUpsertUserReview,
  useDeleteUserReview,
  useUpsertPlaceFeature,
  useDeletePlaceFeature,
  useDeletePlace,
  useToggleLike,
  useToggleSave,
  useVisitStats,
  useInvalidatePlaceFeatures
} from "@/entities/place/queries";
import { useMyFolders } from "@/entities/folder/queries";
import { FolderSelectionModal } from "./FolderSelection.modal";
import { VisitHistoryModal } from "./VisitHistory.modal";
import { ReviewListModal } from "./ReviewList.modal";
import { useUserStore, isAdmin } from "@/entities/user";
import { 
  Button, 
  Input, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  ImageViewer,
  ReviewCard,
  MenuCard,
  FeatureCard,
  PlaceActionRow,
  PlaceFeatureTags
} from "@/shared/ui";
import { ReviewForm } from "./ReviewForm";
import { ContentForm } from "./ContentForm";
import { cn } from "@/shared/lib/utils";
import { safeFormatDate } from "@/shared/lib/date";
import { convertToNaverResizeImageUrl, formatWithCommas } from "@/shared/lib";
import { 
  requestYouTubeMetaService, 
  requestCommunityMetaService,
  parseSocialUrlService 
} from "@/shared/api/edge-function";
import { uploadReviewImage } from "@/shared/lib/storage";
import type { PlaceUserReview, Feature, ReviewTag, ReviewImage } from "@/entities/place/types";
import { VOTED_KEYWORD_MAP, KEYWORD_CATEGORY_COLORS } from "@/entities/place/constants";

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
  const { data: serverReviews = [] } = usePlaceUserReviews(placeId!);
  const [testReviews, setTestReviews] = useState<PlaceUserReview[]>([]);
  
  const reviews = useMemo(() => [...testReviews, ...serverReviews], [testReviews, serverReviews]);

  const { data: placeFeaturesData = [], refetch: refetchFeatures } = usePlaceFeatures(placeId!);
  
  // 테스트용 랜덤 리뷰 생성 함수
  const addRandomReviews = (count: number) => {
    const contents = [
      "최근 먹은 돈가스중에 최고.. 진짜 맛있당",
      "분위기가 너무 좋아요! 데이트 코스로 강추",
      "사장님이 친절하시고 양도 많아요",
      "웨이팅이 좀 있지만 기다릴만한 가치가 있음",
      "커피 향이 너무 좋네요. 조용히 작업하기 좋습니다",
      "가성비 대박... 이 가격에 이 퀄리티라니",
      "인테리어가 예뻐서 사진 찍기 좋아요",
      "음식이 깔끔하고 정갈하게 나옵니다",
      "재방문 의사 200%!!",
      "주차가 좀 불편하지만 맛은 보장합니다",
      "여기 정말 대단해요. 처음 방문했을 때부터 분위기에 압도당했는데, 음식 맛을 보고 나니 왜 사람들이 줄을 서서 기다리는지 단번에 이해가 가더라고요. 특히 시그니처 메뉴인 돈가스는 겉바속촉의 정석이었고, 함께 나오는 소스와의 조화가 일품이었습니다. 직원분들도 너무 친절하셔서 식사 내내 기분이 좋았네요. 다음에는 부모님 모시고 꼭 다시 오고 싶습니다. 공간이 조금 협소하긴 하지만 그게 오히려 아늑한 느낌을 줘서 좋았어요. 강력 추천합니다!",
      "친구들과 함께 방문했는데 모두가 만족한 식사였습니다. 인테리어가 세련되어서 사진 찍기에도 너무 좋고, 조명 하나하나 신경 쓴 게 느껴지더라고요. 메뉴 구성도 다양해서 선택의 폭이 넓었고, 저희가 주문한 모든 음식이 기대 이상이었습니다. 특히 재료의 신선함이 입안 가득 느껴져서 건강한 한 끼를 먹은 기분이에요. 가격대가 조금 있는 편이지만 그만큼의 가치를 충분히 한다고 생각합니다. 주말에는 사람이 많으니 미리 예약하고 가시는 걸 추천드려요. 재방문 의사 100%입니다!",
      "혼자서 조용히 시간을 보내고 싶어 찾은 곳인데 정말 탁월한 선택이었습니다. 잔잔하게 흐르는 음악과 은은한 커피 향이 마음을 편안하게 해주더라고요. 사장님께서 직접 로스팅하신다는 원두는 산미와 바디감이 적절히 조화되어 제가 딱 좋아하는 스타일이었습니다. 함께 주문한 디저트도 너무 달지 않고 담백해서 커피와 찰떡궁합이었네요. 노트북 작업을 하기에도 콘센트 위치가 적절하고 의자도 편안해서 시간 가는 줄 모르고 머물렀습니다. 앞으로 저만의 아지트가 될 것 같은 느낌이에요. 조용한 분위기를 선호하시는 분들께 강추합니다."
    ];
    const nicknames = ["우왕굳", "맛잘알", "프로혼밥러", "데이트장인", "카페투어", "맛집탐방", "동네주민"];
    const ageGroups = ["10s", "20s", "30s", "40s", "50s+"];
    const genders = ["M", "F"];
    
    const newReviews: PlaceUserReview[] = Array.from({ length: count }).map(() => {
      const baseContent = contents[Math.floor(Math.random() * contents.length)];
      // 100~500자 사이로 만들기 위해 내용 반복 및 조합
      let finalContent = baseContent;
      while (finalContent.length < 150) {
        finalContent += " " + contents[Math.floor(Math.random() * contents.length)];
      }
      if (finalContent.length > 500) {
        finalContent = finalContent.substring(0, 497) + "...";
      }

      return {
        id: Math.random().toString(36).substring(2, 11),
        user_id: "test-user-id",
        place_id: placeId!,
        review_content: finalContent,
        score: Math.floor(Math.random() * 5) + 1,
        media_urls: null,
        gender_code: genders[Math.floor(Math.random() * genders.length)] as "M" | "F",
        age_group_code: ageGroups[Math.floor(Math.random() * ageGroups.length)] as any,
        is_private: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_my_review: false,
        tags: [
          { code: "again", group: "추천", label: "또 오고싶음", is_positive: true },
          { code: "good_atmosphere", group: "분위기", label: "분위기 최고", is_positive: true },
          { code: "good_taste", group: "맛", label: "맛 최고", is_positive: true }
        ].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1),
        user_profile: {
          nickname: nicknames[Math.floor(Math.random() * nicknames.length)],
          gender_code: genders[Math.floor(Math.random() * genders.length)] as "M" | "F",
          age_group_code: ageGroups[Math.floor(Math.random() * ageGroups.length)],
          profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).substring(7)}`
        },
        images: Math.random() > 0.5 ? [
          {
            id: Math.random().toString(36).substring(2, 11),
            image_path: "b75408a1-c1cf-43b6-b6f1-3b7288745b62/new/1770269036226.jpeg"
          }
        ] : [],
        is_drinking: Math.random() > 0.8,
        drinking_bottles: Math.floor(Math.random() * 3) + 1
      };
    });

    setTestReviews(prev => {
      const combined = [...newReviews, ...prev];
      return combined.slice(0, 100);
    });
  };

  const removeTestReview = () => {
    setTestReviews(prev => prev.slice(1));
  };
  
  // 관련 콘텐츠는 v1_get_place_features (placeFeaturesData)만 사용
  const allFeatures = placeFeaturesData;

  const { data: myFolders = [] } = useMyFolders({ placeId: placeId! });
  const { data: visitStats } = useVisitStats(placeId!);
  
  const isDataStale = details && details.id !== placeId;
  const showLoading = isDetailsLoading || isDataStale;

  const upsertReviewMutation = useUpsertUserReview();
  const deleteReviewMutation = useDeleteUserReview(placeId!);
  const upsertPlaceFeatureMutation = useUpsertPlaceFeature();
  const deletePlaceFeatureMutation = useDeletePlaceFeature(placeId!);
  const deletePlaceMutation = useDeletePlace();
  const toggleLikeMutation = useToggleLike();
  const toggleSaveMutation = useToggleSave();
  const invalidatePlaceFeatures = useInvalidatePlaceFeatures();

  const isSavedToAnyFolder = useMemo(() => 
    isAuthenticated && myFolders.some((f: any) => f.is_place_in_folder), 
    [myFolders, isAuthenticated]
  );

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<'all' | 'youtube' | 'community'>('all');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllMenus, setShowAllMenus] = useState(false);
  const [showOnlyMyReviews, setShowOnlyMyReviews] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isRequestProcessing, setIsRequestProcessing] = useState(false);

  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState<string | null>(null);
  const [showDeleteFeatureConfirm, setShowDeleteFeatureConfirm] = useState<string | null>(null);
  const [showDeletePlaceConfirm, setShowDeletePlaceConfirm] = useState(false);

  const [gender, setGender] = useState<'M' | 'F' | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [showDemographicsForm, setShowDemographicsForm] = useState(false);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showVisitHistoryModal, setShowVisitHistoryModal] = useState(false);
  const [showContentAddForm, setShowContentAddForm] = useState(false);
  const [contentUrlInput, setContentUrlInput] = useState('');
  const [contentFormError, setContentFormError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10;

  const [isUploading, setIsUploading] = useState(false);

  const [imageViewerState, setImageViewerState] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

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
    setActiveContentTab('all');
    setShowContentAddForm(false);
    setContentUrlInput('');
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

  const youtubeFeatures = useMemo(() => allFeatures.filter((f: Feature) => f.platform_type === 'youtube'), [allFeatures]);
  const communityFeatures = useMemo(() => allFeatures.filter((f: Feature) => f.platform_type === 'community'), [allFeatures]);
  const socialFeatures = useMemo(() => allFeatures.filter((f: Feature) => f.platform_type === 'social'), [allFeatures]);
  const folderFeatures = useMemo(() => allFeatures.filter((f: Feature) => f.platform_type === 'folder'), [allFeatures]);
  const publicUserFeatures = useMemo(() => allFeatures.filter((f: Feature) => f.platform_type === 'public_user'), [allFeatures]);
  
  const displayFeatures = useMemo(() => {
    if (activeContentTab === 'youtube') return youtubeFeatures;
    if (activeContentTab === 'community') return [...communityFeatures, ...socialFeatures];
    return [...youtubeFeatures, ...communityFeatures, ...socialFeatures];
  }, [activeContentTab, youtubeFeatures, communityFeatures, socialFeatures]);

  const hasAnyContent = useMemo(() => 
    youtubeFeatures.length > 0 || communityFeatures.length > 0 || socialFeatures.length > 0,
    [youtubeFeatures, communityFeatures, socialFeatures]
  );
  
  const hasBothTypes = useMemo(() => 
    youtubeFeatures.length > 0 && (communityFeatures.length > 0 || socialFeatures.length > 0),
    [youtubeFeatures, communityFeatures, socialFeatures]
  );
  
  const filteredReviews = useMemo(() => {
    const publicReviews = reviews.filter(r => !r.is_private || r.is_my_review);
    if (showOnlyMyReviews) {
      return publicReviews.filter(r => r.is_my_review);
    }
    return publicReviews;
  }, [reviews, showOnlyMyReviews]);

  const publicReviewsCount = useMemo(() => reviews.filter(r => !r.is_private || r.is_my_review).length, [reviews]);
  const myReview = useMemo(() => reviews.find(r => r.is_my_review), [reviews]);
  const displayedReviews = useMemo(() => showAllReviews ? filteredReviews : filteredReviews.slice(0, 5), [filteredReviews, showAllReviews]);
  
  const MAX_VISIBLE_MENUS = 6;
  const visibleMenus = useMemo(() => {
    if (!Array.isArray(details?.menus)) return [];
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
    else {
      if (window.history.length <= 1) {
        navigate("/feed", { replace: true });
      } else {
        navigate(-1);
      }
    }
  };

  const resetReviewForm = () => {
    setShowReviewForm(false);
    setEditingReviewId(null);
  };

  const handleSaveReview = async (data: {
    rating: number;
    comment: string;
    tagCodes: string[];
    isPrivate: boolean;
    visitDate: string;
    imageFiles: File[];
    isDrinking: boolean;
    bottles: number;
  }) => {
    setIsUploading(true);
    try {
      const uploadPromises = data.imageFiles.map(file => 
        uploadReviewImage(file, currentUser!.auth_user_id, 'new')
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const successfulPaths = uploadResults
        .filter(res => !res.error)
        .map(res => res.path);

      await upsertReviewMutation.mutateAsync({
        p_place_id: placeId!,
        p_review_content: data.comment,
        p_score: data.rating,
        p_is_private: data.isPrivate,
        p_gender_code: gender,
        p_age_group_code: ageGroup,
        p_tag_codes: data.tagCodes,
        p_profile_gender_and_age_by_pass: (gender !== currentUser?.gender_code || ageGroup !== currentUser?.age_group_code),
        p_image_paths: successfulPaths,
        p_created_at: data.visitDate,
        p_is_drinking: data.isDrinking,
        p_drinking_bottles: data.bottles
      });
      resetReviewForm();
    } catch (e: any) { alert(e.message); }
    finally { setIsUploading(false); }
  };

  const handleSaveEditReview = async (reviewId: string, data: {
    rating: number;
    comment: string;
    tagCodes: string[];
    isPrivate: boolean;
    visitDate: string;
    imageFiles: File[];
    deletedImageIds: string[];
    isDrinking: boolean;
    bottles: number;
  }) => {
    setIsUploading(true);
    try {
      const uploadPromises = data.imageFiles.map(file => 
        uploadReviewImage(file, currentUser!.auth_user_id, reviewId)
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const successfulPaths = uploadResults
        .filter(res => !res.error)
        .map(res => res.path);

      await upsertReviewMutation.mutateAsync({
        p_review_id: reviewId,
        p_place_id: placeId!,
        p_review_content: data.comment,
        p_score: data.rating,
        p_is_private: data.isPrivate,
        p_tag_codes: data.tagCodes,
        p_profile_gender_and_age_by_pass: true,
        p_image_paths: successfulPaths,
        p_deleted_image_ids: data.deletedImageIds,
        p_created_at: data.visitDate,
        p_is_drinking: data.isDrinking,
        p_drinking_bottles: data.bottles
      });
      resetReviewForm();
    } catch (e: any) { alert(e.message); }
    finally { setIsUploading(false); }
  };

  const handleDeleteReview = async () => {
    if (!showDeleteReviewConfirm) return;
    try {
      await deleteReviewMutation.mutateAsync(showDeleteReviewConfirm);
      setShowDeleteReviewConfirm(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleAddFeature = async (urlOverride?: string) => {
    const url = urlOverride || contentUrlInput.trim();
    if (!url) return;
    
    setIsRequestProcessing(true);
    setContentFormError(null);
    setRetryCount(0);
    
    try {
      let platform: 'youtube' | 'community' | null = null;
      let title: string | null = null;
      let metadata: any = null;

      // 플랫폼 자동 판별
      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
      const isCommunity = ['clien.net', 'damoang.net', 'bobaedream.co.kr'].some(d => url.includes(d));
      
      // 소셜 미디어 패턴 체크 (Threads, Instagram)
      const threadsRegex = /https?:\/\/(?:www\.)?threads\.(?:net|com)\/@[^\/\?#]+\/post\/[^\/\?#]+/;
      const instagramRegex = /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reels|reel)\/[^\/\?#]+/;
      const isSocial = threadsRegex.test(url) || instagramRegex.test(url);

      if (isYoutube) {
        platform = 'youtube';
        const videoId = url.includes('youtu.be') 
          ? url.split('/').pop()?.split('?')[0] 
          : url.includes('/shorts/')
            ? url.split('/shorts/')[1].split(/[?&]/)[0]
            : url.match(/[?&]v=([^&]+)/)?.[1];
        if (!videoId) throw new Error('유효한 YouTube URL이 아닙니다.');
        const { error, results } = await requestYouTubeMetaService(videoId);
        if (error) throw new Error('YouTube 정보를 가져올 수 없습니다.');
        title = results.title; 
        metadata = results;
      } else if (isCommunity) {
        platform = 'community';
        let communityResults = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          setRetryCount(attempt);
          try {
            const { error: metaError, results } = await requestCommunityMetaService(url);
            if (!metaError && results) {
              const isClienBlocked = results.domain === 'clien.net' && results.url?.includes('notConnection.html?blockedIp');
              if (!isClienBlocked) {
                communityResults = results;
                break;
              }
            }
          } catch (error) { console.error(`시도 ${attempt} 실패:`, error); }
          if (attempt < maxRetries) await new Promise(r => setTimeout(r, 1000));
        }

        if (!communityResults) throw new Error('커뮤니티 정보를 가져올 수 없습니다.');
        title = communityResults.title;
        metadata = communityResults;
      } else if (isSocial) {
        const { error, results } = await parseSocialUrlService(url, placeId!);
        if (error) throw new Error('소셜 미디어 정보를 가져올 수 없습니다.');
        
        // 소셜 콘텐츠 등록 성공 후 목록 갱신
        await refetchFeatures();
        await invalidatePlaceFeatures(placeId!);
        
        setContentUrlInput('');
        setShowContentAddForm(false);
        return;
      } else {
        throw new Error('지원되지 않는 서비스 링크입니다.');
      }

      await upsertPlaceFeatureMutation.mutateAsync({
        p_business_id: placeId!, 
        p_platform_type: platform, 
        p_content_url: url, 
        p_title: title, 
        p_metadata: metadata
      });
      
      setContentUrlInput('');
      setShowContentAddForm(false);
    } catch (e: any) { 
      setContentFormError(e.message); 
    } finally { 
      setIsRequestProcessing(false);
      setRetryCount(0);
    }
  };

  const handleDeleteFeature = async () => {
    if (!showDeleteFeatureConfirm) return;
    try {
      await deletePlaceFeatureMutation.mutateAsync(showDeleteFeatureConfirm);
      setShowDeleteFeatureConfirm(null);
      // 삭제 성공 후 목록 갱신
      if (placeId) {
        await refetchFeatures();
        await invalidatePlaceFeatures(placeId);
      }
    } catch (e: any) { alert(e.message); }
  };

  const handleDeletePlace = async () => {
    if (!placeId) return;
    try {
      await deletePlaceMutation.mutateAsync(placeId);
      setShowDeletePlaceConfirm(false);
      handleClose();
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
        <header className="relative z-20 flex h-14 flex-shrink-0 items-center justify-between px-4 bg-white dark:bg-surface-950 border-b border-surface-100 dark:border-surface-800">
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-surface-900 dark:text-surface-100" />
          </button>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => navigator.share && navigator.share({ title: details?.name, url: window.location.href })} 
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
            >
              <Share2 className="size-5 text-surface-700 dark:text-surface-300" />
            </button>

            {isAdmin(currentUser) && (
              <button 
                onClick={() => setShowDeletePlaceConfirm(true)}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-rose-500 transition-colors"
              >
                <Trash2 className="size-5" />
              </button>
            )}
          </div>
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

                  <div className="absolute top-16 left-4 pointer-events-none flex flex-col gap-2">
                    {details?.avg_price && details.avg_price > 0 && (
                      <div className="bg-black/70 px-3 py-1.5 rounded-full">
                        <span className="text-[13px] font-medium text-white">
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
                    <div className="absolute bottom-4 right-4 bg-primary-600 text-white px-2.5 py-1 rounded-full text-[11px] font-medium">
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
                    <h1 className="text-2xl font-medium text-surface-900 dark:text-white truncate">{details?.name}</h1>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="font-medium text-surface-500">{details?.group1} {details?.group2} {details?.group3}</span>
                    <span className="text-surface-200">|</span>
                    <div className="flex items-center gap-0.5 font-medium text-amber-500">
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

              <PlaceActionRow 
                placeId={placeId!}
                reviewsCount={details?.interaction?.place_reviews_count || 0}
                visitCount={visitStats?.visit_count || 0}
                onReviewClick={() => document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })}
                onVisitClick={() => setShowVisitHistoryModal(true)}
                youtubeCount={youtubeFeatures.length}
                placeCount={folderFeatures.length}
                detectiveCount={publicUserFeatures.length}
                communityCount={communityFeatures.length + socialFeatures.length}
                showStats={false}
              />

              <PlaceFeatureTags 
                place={{ ...details, features: allFeatures }}
                className="mt-2"
                onFolderClick={(e, folder) => {
                  e.stopPropagation();
                  if (placeIdFromStore) {
                    usePlacePopup.setState({ isOpen: false, placeId: null });
                  }
                  navigate(`/feature/detail/folder/${folder.id}`, { replace: true });
                }}
              />
            </div>

            <div className="space-y-8 py-4">
              {/* {details?.road && (
                <div className="px-4">
                  <div className="p-4 bg-surface-50 dark:bg-surface-900 rounded-xl">
                    <p className="text-[14px] leading-relaxed text-surface-600 dark:text-surface-400 whitespace-pre-line">{details.road}</p>
                  </div>
                </div>
              )} */}

              <section id="review-section" className="py-2">
                {editingReviewId || showReviewForm ? (
                  // 수정 중이거나 작성 중일 때는 폼만 표시
                  <div className="px-4 mb-4">
                    {editingReviewId && filteredReviews.find(r => r.id === editingReviewId) ? (
                      <ReviewForm
                        initialRating={filteredReviews.find(r => r.id === editingReviewId)!.score}
                        initialComment={filteredReviews.find(r => r.id === editingReviewId)!.review_content}
                        initialTagCodes={filteredReviews.find(r => r.id === editingReviewId)!.tags.map(t => t.code)}
                        initialIsPrivate={filteredReviews.find(r => r.id === editingReviewId)!.is_private}
                        initialDate={filteredReviews.find(r => r.id === editingReviewId)!.created_at?.split('T')[0]}
                        initialIsDrinking={filteredReviews.find(r => r.id === editingReviewId)!.is_drinking ?? false}
                        initialBottles={filteredReviews.find(r => r.id === editingReviewId)!.drinking_bottles ?? 1}
                        initialImages={filteredReviews.find(r => r.id === editingReviewId)!.images || []}
                        availableTags={availableTags}
                        isUploading={isUploading}
                        onSubmit={(data) => handleSaveEditReview(editingReviewId, data)}
                        onCancel={resetReviewForm}
                      />
                    ) : showReviewForm ? (
                      <ReviewForm
                        availableTags={availableTags}
                        isUploading={isUploading}
                        onSubmit={handleSaveReview}
                        onCancel={resetReviewForm}
                      />
                    ) : null}
                  </div>
                ) : publicReviewsCount > 0 ? (
                  <>
                    <div className="flex flex-col gap-3 px-4 mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          방문 리뷰 <span className="text-primary-500 font-medium">{publicReviewsCount}</span>
                        </h3>
                        <div className="flex items-center gap-3">
                          {/* UI/UX 테스트용 버튼 */}
                          <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg mr-2">
                            <button 
                              onClick={removeTestReview}
                              className="size-7 flex items-center justify-center bg-white dark:bg-surface-700 rounded shadow-sm text-surface-600 active:scale-90"
                              title="리뷰 1개 제거"
                            >
                              -
                            </button>
                            <button 
                              onClick={() => addRandomReviews(1)}
                              className="size-7 flex items-center justify-center bg-white dark:bg-surface-700 rounded shadow-sm text-surface-600 active:scale-90"
                              title="랜덤 리뷰 1개 추가"
                            >
                              +
                            </button>
                            <button 
                              onClick={() => addRandomReviews(5)}
                              className="size-7 flex items-center justify-center bg-white dark:bg-surface-700 rounded shadow-sm text-surface-600 active:scale-90"
                              title="랜덤 리뷰 5개 추가"
                            >
                              *
                            </button>
                          </div>

                          {publicReviewsCount > 5 && (
                            <button 
                              onClick={() => setShowAllReviews(true)} 
                              className="text-[13px] font-medium text-primary-600"
                            >
                              전체보기 ({publicReviewsCount})
                            </button>
                          )}
                          {!showReviewForm && (
                            <button 
                              onClick={() => {
                                if (!isAuthenticated) return alert('로그인이 필요합니다.');
                                setShowReviewForm(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[12px] font-medium rounded-lg active:scale-95 transition-transform"
                            >
                              <Plus className="size-3.5" />
                              추가
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {isAuthenticated && myReview && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowOnlyMyReviews(!showOnlyMyReviews)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border",
                              showOnlyMyReviews 
                                ? "bg-primary-500 border-primary-500 text-white shadow-sm shadow-primary-100" 
                                : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-500"
                            )}
                          >
                            내 리뷰만 보기
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {filteredReviews.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
                        {filteredReviews.map(review => (
                          <ReviewCard
                            key={review.id}
                            variant="compact"
                            review={review}
                            isMyReview={review.is_my_review}
                            onEdit={() => setEditingReviewId(review.id)}
                            onDelete={() => setShowDeleteReviewConfirm(review.id)}
                            onProfileClick={(userId) => navigate(`/p/user/${userId}`)}
                            onImageClick={(images, index) => setImageViewerState({
                              isOpen: true,
                              images,
                              initialIndex: index
                            })}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mx-4 py-8 text-center bg-surface-50 dark:bg-surface-900/50 rounded-xl border border-dashed border-surface-200 dark:border-surface-800">
                        <p className="text-sm text-surface-400">
                          작성한 리뷰가 없습니다
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-4 mb-4">
                    {showReviewForm ? (
                      <ReviewForm
                        availableTags={availableTags}
                        isUploading={isUploading}
                        onSubmit={handleSaveReview}
                        onCancel={resetReviewForm}
                      />
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">방문 리뷰</h3>
                          <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
                            <button 
                              onClick={removeTestReview}
                              className="size-7 flex items-center justify-center bg-white dark:bg-surface-700 rounded shadow-sm text-surface-600 active:scale-90"
                              title="리뷰 1개 제거"
                            >
                              -
                            </button>
                            <button 
                              onClick={() => addRandomReviews(1)}
                              className="size-7 flex items-center justify-center bg-white dark:bg-surface-700 rounded shadow-sm text-surface-600 active:scale-90"
                              title="랜덤 리뷰 1개 추가"
                            >
                              +
                            </button>
                            <button 
                              onClick={() => addRandomReviews(5)}
                              className="size-7 flex items-center justify-center bg-white dark:bg-surface-700 rounded shadow-sm text-surface-600 active:scale-90"
                              title="랜덤 리뷰 5개 추가"
                            >
                              *
                            </button>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (!isAuthenticated) return alert('로그인이 필요합니다.');
                            setShowReviewForm(true);
                          }}
                          className="py-6 w-full text-center bg-surface-50 dark:bg-surface-900/50 rounded-xl border border-dashed border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors group"
                        >
                          <p className="text-sm text-surface-400 group-hover:text-primary-500 transition-colors">
                            리뷰가 없습니다. 첫 리뷰를 작성해보세요!
                          </p>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {Array.isArray(details?.menus) && details.menus.length > 0 && (
                <section className="py-2">
                  <div className="flex items-center justify-between px-4 mb-3">
                    <h3 className="text-lg font-medium">메뉴</h3>
                    <button 
                      onClick={() => setShowAllMenus(!showAllMenus)} 
                      className="text-surface-400 p-1"
                    >
                      {showAllMenus ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                    </button>
                  </div>
                  
                  {showAllMenus ? (
                    <div className="grid grid-cols-3 gap-3 px-4">
                      {visibleMenus.map((menu: any, index: number) => (
                        <MenuCard key={index} menu={menu} variant="grid" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
                      {visibleMenus.map((menu: any, index: number) => (
                        <MenuCard key={index} menu={menu} variant="compact" />
                      ))}
                    </div>
                  )}
                </section>
              )}

              <section className="px-4 py-6 relative border-t border-surface-50 dark:border-surface-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">관련 콘텐츠</h3>
                  
                  <div className="flex items-center gap-2">
                    {!showContentAddForm && isAuthenticated && (
                      <button 
                        onClick={() => setShowContentAddForm(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[12px] font-medium rounded-lg active:scale-95 transition-all"
                      >
                        <Plus className="size-3.5" />
                        추가
                      </button>
                    )}

                    {!showContentAddForm && hasBothTypes && (
                      <div className="flex bg-surface-100 dark:bg-surface-900 p-0.5 rounded-lg">
                      <button 
                        onClick={() => setActiveContentTab('all')}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all", 
                          activeContentTab === 'all' ? "bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm" : "text-surface-400"
                        )}
                      >전체</button>
                      <button 
                        onClick={() => setActiveContentTab('youtube')}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all", 
                          activeContentTab === 'youtube' ? "bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm" : "text-surface-400"
                        )}
                      >유튜브</button>
                      <button 
                        onClick={() => setActiveContentTab('community')}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all", 
                          activeContentTab === 'community' ? "bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm" : "text-surface-400"
                        )}
                      >커뮤니티</button>
                    </div>
                  )}
                </div>
              </div>

                {showContentAddForm ? (
                  <div className="mb-6">
                    <ContentForm 
                      isProcessing={isRequestProcessing}
                      error={contentFormError}
                      onSubmit={async (url) => {
                        await handleAddFeature(url);
                      }}
                      onCancel={() => {
                        setShowContentAddForm(false);
                        setContentUrlInput('');
                        setContentFormError(null);
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {hasAnyContent ? (
                      displayFeatures.length > 0 ? (
                        displayFeatures.map((feature: Feature) => (
                          <FeatureCard 
                            key={feature.id} 
                            feature={feature} 
                            getPlatformName={getPlatformName}
                            isOwner={isAdmin(currentUser) || feature.user_id === currentUser?.auth_user_id}
                            onDelete={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowDeleteFeatureConfirm(feature.id);
                            }}
                          />
                        ))
                      ) : (
                        <button 
                          onClick={() => {
                            if (!isAuthenticated) return alert('로그인이 필요합니다.');
                            setShowContentAddForm(true);
                          }}
                          className="py-6 w-full text-center bg-surface-50 dark:bg-surface-900/50 rounded-xl border border-dashed border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors group"
                        >
                          <p className="text-sm text-surface-400 group-hover:text-primary-500 transition-colors">콘텐츠가 없습니다. 관련 콘텐츠를 추가해보세요!</p>
                        </button>
                      )
                    ) : (
                      <div className="py-6 text-center bg-surface-50 dark:bg-surface-900/50 rounded-xl border border-dashed border-surface-200 dark:border-surface-800">
                        <p className="text-sm text-surface-400">콘텐츠가 없습니다.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
          )}
        </div>

        {/* 하단 스티키 - 방문자 리뷰 키워드 */}
        {details?.voted_keyword?.details && details.voted_keyword.details.length > 0 && (() => {
          const sortedKeywords = [...details.voted_keyword.details]
            .filter((t: any) => t.count > 0)
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 5);
          
          const totalCount = details.voted_keyword.details.reduce((sum: number, t: any) => sum + t.count, 0);

          if (sortedKeywords.length === 0) return null;

          return (
            <footer className="relative z-20 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-t border-surface-100 dark:border-surface-800 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide no-wrap">
                {sortedKeywords.map((keyword: any) => {
                  const mappedInfo = VOTED_KEYWORD_MAP[keyword.code];
                  const displayLabel = mappedInfo?.label || keyword.displayName || keyword.label;
                  const percentage = Math.round((keyword.count / totalCount) * 100);

                  return (
                    <div key={keyword.code} className="flex items-center gap-1 shrink-0">
                      {keyword.iconUrl && (
                        <img src={keyword.iconUrl} alt="" className="size-3 object-contain flex-shrink-0" />
                      )}
                      <span className="text-[10px] font-medium text-surface-600 dark:text-surface-400 whitespace-nowrap">
                        {displayLabel} {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </footer>
          );
        })()}
      </div>

      <Dialog open={!!showDeleteReviewConfirm} onOpenChange={(open) => !open && setShowDeleteReviewConfirm(null)}>
        <DialogContent className="rounded-2xl max-w-[320px]">
          <DialogTitle className="text-center font-medium">리뷰 삭제</DialogTitle>
          <p className="text-center text-sm text-surface-500">정말로 삭제하시겠습니까?</p>
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteReviewConfirm(null)}>취소</Button>
            <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={handleDeleteReview}>삭제</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeletePlaceConfirm} onOpenChange={setShowDeletePlaceConfirm}>
        <DialogContent className="rounded-2xl max-w-[320px]">
          <DialogTitle className="text-center font-medium">장소 삭제</DialogTitle>
          <p className="text-center text-sm text-surface-500">이 장소를 정말로 삭제하시겠습니까?<br/>삭제된 데이터는 복구할 수 없습니다.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeletePlaceConfirm(false)}>취소</Button>
            <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={handleDeletePlace}>장소 삭제</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeleteFeatureConfirm} onOpenChange={(open) => !open && setShowDeleteFeatureConfirm(null)}>
        <DialogContent className="rounded-2xl max-w-[320px]">
          <DialogTitle className="text-center font-medium">콘텐츠 삭제</DialogTitle>
          <p className="text-center text-sm text-surface-500">정말로 삭제하시겠습니까?</p>
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteFeatureConfirm(null)}>취소</Button>
            <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={handleDeleteFeature}>삭제</Button>
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

      {showAllReviews && (
        <ReviewListModal
          placeId={placeId!}
          placeName={details?.name || ""}
          reviews={reviews}
          onClose={() => setShowAllReviews(false)}
          onEdit={(reviewId) => {
            setEditingReviewId(reviewId);
            setShowAllReviews(false);
          }}
          onDelete={(reviewId) => {
            setShowDeleteReviewConfirm(reviewId);
            // Modal stays open, dialog appears on top (hopefully)
          }}
          onWrite={() => {
            setShowReviewForm(true);
            setShowAllReviews(false);
          }}
        />
      )}

      <ImageViewer
        images={imageViewerState.images}
        initialIndex={imageViewerState.initialIndex}
        isOpen={imageViewerState.isOpen}
        onClose={() => setImageViewerState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>,
    document.body
  );
}
