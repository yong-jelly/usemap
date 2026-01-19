import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/shared/ui/Button";
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  User, 
  FileText, 
  Calendar, 
  Users, 
  MapPin, 
  X, 
  ChevronDown, 
  ChevronUp,
  Save,
  RefreshCcw,
  Store,
  MapPinOff,
  UserPlus,
  Trash2,
  Search,
  Loader2,
  CookingPot,
  EyeOff,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router";
import { supabase } from "@/shared/lib/supabase";
import { searchPlaceService } from "@/shared/api/edge-function";
import { convertToNaverResizeImageUrl } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";

interface InstagramUser {
  id: string;
  user_name: string;
  full_name: string;
  bio: string;
  followers: number;
  created_at: string;
  updated_at: string;
  content_count: number;
  place_filled_count: number;
  last_content_at: string | null;
}

interface MappedPlace {
  place_id: string;
  place_name: string;
  thumbnail_url: string;
}

interface InstagramContent {
  id: string;
  user_id: string;
  user_name: string;
  code: string;
  taken_at: string;
  caption: string;
  is_place: boolean | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  total_count: number;
  mapped_places: MappedPlace[] | null;
}

// 업체 검색 모달 컴포넌트
interface PlaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (places: MappedPlace[]) => void;
  selectedIds: string[];
  caption?: string;
}

function InstagramPlaceSearchModal({ isOpen, onClose, onSelect, selectedIds, caption }: PlaceSearchModalProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [showCaptionInSearch, setShowCaptionInSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedIds);
      setQuery("");
      setSearchResults([]);
      setHasSearched(false);
      setQueuedCount(0);
      setShowCaptionInSearch(false);
      // 모달이 열리면 input에 포커스
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, selectedIds]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setHasSearched(true);
    setIsLoading(true);
    setQueuedCount(0);
    try {
      const res = await searchPlaceService(query.trim());
      if (!res.error && res.rows) {
        setQueuedCount(res.queued_count || 0);
        const uniqueIds = [...new Set(res.rows.map((row: any) => row.id))] as string[];
        if (uniqueIds.length > 0) {
          const { data, error } = await supabase.rpc("v1_list_places_simple_by_ids", {
            p_place_ids: uniqueIds
          });
          if (error) throw error;
          setSearchResults(data || []);
        } else {
          setSearchResults([]);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setTempSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selectedPlaces = searchResults
      .filter(r => tempSelectedIds.includes(r.place_id))
      .map(r => ({
        place_id: r.place_id,
        place_name: r.place_name,
        thumbnail_url: r.thumbnail_url
      }));
    
    // 만약 검색 결과에 없더라도 (이미 선택되어 있던 항목 등) IDs는 유지해야 함
    // 하지만 낙관적 업데이트를 위해선 데이터가 필요함.
    // 여기서는 신규 추가되는 항목들 위주로 전달함.
    onSelect(selectedPlaces);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-surface-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
          <h2 className="font-bold text-lg">업체 검색 및 선택</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input 
              ref={inputRef}
              className="w-full pl-9 pr-4 py-2 bg-surface-50 dark:bg-surface-800 border-none rounded-xl text-base focus:ring-2 focus:ring-primary-500 outline-none font-bold"
              placeholder="업체명 검색..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button size="sm" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {hasSearched && queuedCount > 0 && (
            <div className="mx-2 mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-900/30 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <RefreshCcw className="w-4 h-4 text-primary-500 animate-spin" />
              <p className="text-[13px] font-bold text-primary-700 dark:text-primary-300">
                신규 업장입니다. 5초내 재 검색해주세요(크롤링 진행중)
              </p>
            </div>
          )}

          {searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((place) => (
                <div 
                  key={place.place_id}
                  onClick={() => toggleSelect(place.place_id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                    tempSelectedIds.includes(place.place_id) 
                      ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-900/30" 
                      : "hover:bg-surface-50 dark:hover:bg-surface-800 border-transparent"
                  )}
                >
                  <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 flex-shrink-0 overflow-hidden">
                    {place.thumbnail_url ? (
                      <img 
                        src={convertToNaverResizeImageUrl(place.thumbnail_url)} 
                        className="w-full h-full object-cover" 
                        alt="" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-50 dark:bg-surface-800/50">
                        <CookingPot className="w-6 h-6 text-surface-200 dark:text-surface-700 stroke-[1.2] opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{place.place_name}</p>
                    <p className="text-[11px] text-surface-500 truncate">{place.road_address}</p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    tempSelectedIds.includes(place.place_id)
                      ? "bg-primary-500 border-primary-500 text-white"
                      : "border-surface-300 dark:border-surface-700"
                  )}>
                    {tempSelectedIds.includes(place.place_id) && <Check className="w-3 h-3" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-surface-400">
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
              ) : (
                <>
                  {caption && !hasSearched ? (
                    <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 text-left">
                      <p className="text-xs font-bold text-surface-500 mb-2 uppercase">콘텐츠 캡션</p>
                      <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap">{caption}</p>
                    </div>
                  ) : (
                    <>
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">검색 결과가 없습니다.</p>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-100 dark:border-surface-800 flex flex-col gap-3">
          {caption && hasSearched && (
            <div className="flex justify-center">
              <button 
                onClick={() => setShowCaptionInSearch(!showCaptionInSearch)}
                className="text-[11px] font-bold text-surface-400 hover:text-surface-600 flex items-center gap-1.5 px-3 py-1.5 bg-surface-50 dark:bg-surface-800 rounded-full transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                {showCaptionInSearch ? "캡션 숨기기" : "캡션 다시 보기"}
              </button>
            </div>
          )}

          {showCaptionInSearch && caption && (
            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-[10px] font-bold text-surface-400 mb-1 uppercase">콘텐츠 캡션</p>
              <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap">{caption}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
            <Button 
              className="flex-1" 
              onClick={handleConfirm}
              disabled={tempSelectedIds.length === 0 && selectedIds.length === 0}
            >
              {tempSelectedIds.length}개 선택 완료
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InstagramParserPage() {
  const [view, setView] = useState<"USER_LIST" | "USER_DETAIL">("USER_LIST");
  const [loading, setLoading] = useState(false);
  
  // 사용자 관련 상태
  const [users, setUsers] = useState<InstagramUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<InstagramUser | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [headerInput, setHeaderInput] = useState("");
  const [parsedUserData, setParsedUserData] = useState<any>(null);
  const [userParseError, setUserParseError] = useState<string | null>(null);

  // 콘텐츠 관련 상태
  const [contents, setContents] = useState<InstagramContent[]>([]);
  const [contentInput, setContentInput] = useState("");
  const [parsedContentList, setParsedContentList] = useState<any[]>([]);
  const [expandedContentId, setExpandedContentId] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [contentFilter, setContentFilter] = useState<'all' | 'place' | 'non-place'>('all');
  const [contentPage, setContentPage] = useState(1);
  const [contentTotalCount, setContentTotalCount] = useState(0);
  const contentPageSize = 50;
  const [showHidden, setShowHidden] = useState(false);

  // 업체 검색 모달 관련 상태
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);

  const navigate = useNavigate();

  // 상태 메시지 자동 삭제
  useEffect(() => {
    if (appStatus) {
      const timer = setTimeout(() => setAppStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [appStatus]);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("v1_get_insta_user_list", {
        p_page: 1,
        p_page_size: 100
      });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setAppStatus({ type: 'error', message: "사용자 목록을 불러오는 중 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  };

  // 콘텐츠 목록 조회
  const fetchContents = async (
    userId: string, 
    page: number = contentPage, 
    filter: 'all' | 'place' | 'non-place' = contentFilter,
    hidden: boolean = showHidden,
    isSilent: boolean = false
  ) => {
    if (!isSilent) setLoading(true);
    try {
      const isPlaceFilter = filter === 'all' ? null : filter === 'place' ? true : false;
      
      const { data, error } = await supabase.rpc("v1_get_insta_content_list", {
        p_user_id: userId,
        p_is_place: isPlaceFilter,
        p_page: page,
        p_page_size: contentPageSize,
        p_show_hidden: hidden
      });
      if (error) throw error;
      
      const result = (data || []) as InstagramContent[];
      setContents(result);
      
      if (result.length > 0) {
        setContentTotalCount(Number(result[0].total_count) || 0);
        // 첫 번째 항목을 항상 열림 상태로 설정
        setExpandedContentId(result[0].id);
      } else {
        setContentTotalCount(0);
        setExpandedContentId(null);
      }
    } catch (error) {
      console.error("Error fetching contents:", error);
      if (!isSilent) setAppStatus({ type: 'error', message: "콘텐츠 목록을 불러오는 중 오류가 발생했습니다." });
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // JSON 제어 문자 정리 헬퍼 함수
  const sanitizeJsonString = (jsonString: string): string => {
    let result = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      const charCode = char.charCodeAt(0);
      
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        result += char;
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && (i === 0 || jsonString[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
        continue;
      }
      
      if (inString && charCode >= 0x00 && charCode <= 0x1F) {
        const escapeMap: { [key: number]: string } = {
          0x08: '\\b',
          0x09: '\\t',
          0x0A: '\\n',
          0x0C: '\\f',
          0x0D: '\\r',
        };
        
        if (escapeMap[charCode]) {
          result += escapeMap[charCode];
        } else {
          result += '\\u' + ('0000' + charCode.toString(16)).slice(-4);
        }
      } else {
        result += char;
      }
    }
    
    return result;
  };

  // JSON 파싱 시도 (fallback 포함)
  const tryParseJson = (jsonString: string): { success: boolean; data?: any; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      return { success: true, data: parsed };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      
      if (errorMessage.includes('control character') || errorMessage.includes('Bad control')) {
        try {
          const sanitized = sanitizeJsonString(jsonString);
          const parsed = JSON.parse(sanitized);
          return { success: true, data: parsed };
        } catch (retryError: any) {
          return { 
            success: false, 
            error: `JSON 파싱 오류: 제어 문자가 포함되어 있습니다. (위치: ${errorMessage.match(/position (\d+)/)?.[1] || '알 수 없음'})` 
          };
        }
      }
      
      return { success: false, error: `JSON 파싱 오류: ${errorMessage}` };
    }
  };

  // 사용자 JSON 분석
  const handleParseUser = () => {
    setUserParseError(null);
    const result = tryParseJson(headerInput);
    
    if (!result.success) {
      setUserParseError(result.error || "JSON 형식이 올바르지 않습니다.");
      return;
    }

    const parsed = result.data!;
    const user = parsed?.data?.user || parsed?.user;
    if (!user) {
      setUserParseError("JSON 데이터에 'user' 키를 찾을 수 없습니다. 올바른 사용자 헤더 데이터를 입력했는지 확인해주세요.");
      return;
    }
    setParsedUserData({
      id: user.id || user.pk,
      user_name: user.username,
      full_name: user.full_name,
      bio: user.biography,
      followers: user.follower_count
    });
  };

  // 사용자 저장
  const handleSaveUser = async () => {
    if (!parsedUserData) return;
    setLoading(true);
    try {
      const { error } = await supabase.rpc("v1_set_insta_user", {
        p_id: parsedUserData.id.toString(),
        p_user_name: parsedUserData.user_name,
        p_full_name: parsedUserData.full_name,
        p_bio: parsedUserData.bio,
        p_followers: parsedUserData.followers
      });
      if (error) throw error;
      setAppStatus({
        type: 'success',
        message: "사용자가 저장되었습니다."
      });
      setShowAddUser(false);
      setHeaderInput("");
      setParsedUserData(null);
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      setAppStatus({
        type: 'error',
        message: "사용자 저장 중 오류가 발생했습니다."
      });
    } finally {
      setLoading(false);
    }
  };

  // 콘텐츠 JSON 분석
  const handleParseContent = () => {
    setParseError(null);
    const result = tryParseJson(contentInput);
    
    if (!result.success) {
      const errorMsg = result.error || "JSON 형식이 올바르지 않습니다.";
      if (errorMsg.includes('control character')) {
        setParseError(
          `${errorMsg}\n\n` +
          "가이드: JSON 데이터에 제어 문자가 포함되어 있습니다.\n" +
          "자동으로 정리하여 재시도했지만 실패했습니다.\n" +
          "개발자 도구(F12) -> Network -> 'user_timeline_graphql_connection' 포함된 요청 선택 -> Response 전체 복사 후 붙여넣어 주세요."
        );
      } else {
        setParseError(
          `${errorMsg}\n\n` +
          "가이드: 개발자 도구(F12) -> Network -> 'user_timeline_graphql_connection' 포함된 요청 선택 -> Response 전체 복사 후 붙여넣어 주세요."
        );
      }
      return;
    }

    const parsed = result.data!;
    const connection = 
      parsed?.data?.xdt_api__v1__feed__user_timeline_graphql_connection || 
      parsed?.xdt_api__v1__feed__user_timeline_graphql_connection;

    if (!connection) {
      setParseError(
        "분석할 수 없는 JSON 형식입니다.\n" +
        "가이드: 개발자 도구(F12) -> Network -> 'user_timeline_graphql_connection' 포함된 요청 선택 -> Response 전체 복사 후 붙여넣어 주세요."
      );
      return;
    }

    const edges = connection.edges || [];

    if (edges.length === 0) {
      setParseError("분석할 콘텐츠(edges)가 비어있습니다. 해당 사용자의 게시물이 있는지 확인해주세요.");
      return;
    }

    const extracted = edges.map((edge: any) => ({
      id: edge.node.id,
      code: edge.node.code,
      taken_at: new Date(edge.node.taken_at * 1000).toISOString(),
      caption: edge.node.caption?.text || "",
    }));

    setParsedContentList(extracted);
  };

  // 콘텐츠 저장 (Bulk Upsert)
  const handleSaveContents = async () => {
    if (parsedContentList.length === 0) return;
    setLoading(true);
    try {
      const contentsJson = parsedContentList.map(item => ({
        id: item.id,
        code: item.code,
        taken_at: item.taken_at,
        caption: item.caption || ""
      }));

      const { data, error } = await supabase.rpc("v1_set_insta_contents", {
        p_contents: contentsJson
      });

      if (error) throw error;

      const result = data?.[0];
      const successCount = result?.success_count || 0;
      const errorCount = result?.error_count || 0;
      const errors = result?.errors || [];

      if (errorCount > 0) {
        console.error("일부 콘텐츠 저장 실패:", errors);
        setAppStatus({
          type: errorCount === parsedContentList.length ? 'error' : 'success',
          message: `${successCount}개 저장 완료, ${errorCount}개 실패${errors.length > 0 ? ` (첫 번째 오류: ${errors[0]?.error || '알 수 없음'})` : ''}`
        });
      } else {
        setAppStatus({
          type: 'success',
          message: `${successCount}개의 콘텐츠 저장이 완료되었습니다.`
        });
      }

      setContentInput("");
      setParsedContentList([]);
      if (selectedUser) {
        // 현재 페이지 유지하면서 데이터 갱신
        fetchContents(selectedUser.id, contentPage, contentFilter, showHidden, true);
      }
    } catch (error) {
      console.error("Error saving contents:", error);
      setAppStatus({
        type: 'error',
        message: "콘텐츠 저장 중 오류가 발생했습니다."
      });
    } finally {
      setLoading(false);
    }
  };

  // 업체 여부/매핑 업데이트
  const handleUpdateIsPlace = async (contentId: string, isPlace: boolean) => {
    // 낙관적 업데이트
    const prevContents = [...contents];
    setContents(prev => prev.map(c => 
      c.id === contentId ? { ...c, is_place: isPlace, mapped_places: isPlace ? c.mapped_places : [] } : c
    ));

    try {
      const { error } = await supabase.rpc("v1_set_insta_content_is_place", {
        p_content_id: contentId,
        p_is_place: isPlace
      });
      if (error) throw error;
      
      setAppStatus({ type: 'success', message: isPlace ? "업체 게시물로 지정되었습니다." : "비업체 게시물로 지정되었습니다." });
      if (selectedUser) fetchContents(selectedUser.id, contentPage, contentFilter, showHidden, true);
      if (!isPlace) setExpandedContentId(null);
    } catch (error) {
      console.error("Error updating place status:", error);
      setContents(prevContents); // 롤백
      setAppStatus({ type: 'error', message: "상태 업데이트 중 오류가 발생했습니다." });
    }
  };

  // 콘텐츠 숨김 처리
  const handleToggleHidden = async (contentId: string, currentHidden: boolean) => {
    // 낙관적 업데이트
    const prevContents = [...contents];
    const nextHidden = !currentHidden;
    setContents(prev => prev.map(c => 
      c.id === contentId ? { ...c, is_hidden: nextHidden } : c
    ));

    try {
      const { error } = await supabase.rpc("v1_set_insta_content_hidden", {
        p_content_id: contentId,
        p_is_hidden: nextHidden
      });
      if (error) throw error;
      
      setAppStatus({ type: 'success', message: nextHidden ? "콘텐츠가 목록에서 숨겨졌습니다." : "콘텐츠 숨김이 해제되었습니다." });
      if (selectedUser) fetchContents(selectedUser.id, contentPage, contentFilter, showHidden, true);
      if (nextHidden) setExpandedContentId(null);
    } catch (error) {
      console.error("Error toggling hidden status:", error);
      setContents(prevContents); // 롤백
      setAppStatus({ type: 'error', message: "숨김 상태 변경 중 오류가 발생했습니다." });
    }
  };

  // 업체 매핑 추가
  const handleAddPlaces = async (contentId: string, selectedPlaces: MappedPlace[]) => {
    if (selectedPlaces.length === 0) return;
    
    // 낙관적 업데이트를 위해 기존 매핑된 장소들과 새로 선택된 장소들 합치기 (ID 중복 제거)
    const prevContents = [...contents];
    setContents(prev => prev.map(c => {
      if (c.id === contentId) {
        const currentMapped = c.mapped_places || [];
        const newPlaces = selectedPlaces.filter(sp => !currentMapped.some(mp => mp.place_id === sp.place_id));
        return { 
          ...c, 
          is_place: true, 
          mapped_places: [...currentMapped, ...newPlaces] 
        };
      }
      return c;
    }));

    try {
      const placeIds = selectedPlaces.map(p => p.place_id);
      const { error } = await supabase.rpc("v1_add_instagram_places", {
        p_content_id: contentId,
        p_place_ids: placeIds
      });
      if (error) throw error;
      
      setAppStatus({ type: 'success', message: `${placeIds.length}개의 업체가 연결되었습니다.` });
      if (selectedUser) fetchContents(selectedUser.id, contentPage, contentFilter, showHidden, true);
      setSearchModalOpen(false);
    } catch (error) {
      console.error("Error adding places:", error);
      setContents(prevContents); // 롤백
      setAppStatus({ type: 'error', message: "업체 연결 중 오류가 발생했습니다." });
    }
  };

  // 업체 매핑 제거
  const handleRemovePlace = async (contentId: string, placeId: string) => {
    // 낙관적 업데이트
    const prevContents = [...contents];
    setContents(prev => prev.map(c => {
      if (c.id === contentId) {
        const nextMapped = (c.mapped_places || []).filter(p => p.place_id !== placeId);
        return { 
          ...c, 
          is_place: nextMapped.length > 0, 
          mapped_places: nextMapped 
        };
      }
      return c;
    }));

    try {
      const { error } = await supabase.rpc("v1_remove_instagram_place", {
        p_content_id: contentId,
        p_place_id: placeId
      });
      if (error) throw error;
      
      setAppStatus({ type: 'success', message: "업체 연결이 해제되었습니다." });
      if (selectedUser) fetchContents(selectedUser.id, contentPage, contentFilter, showHidden, true);
    } catch (error) {
      console.error("Error removing place:", error);
      setContents(prevContents); // 롤백
      setAppStatus({ type: 'error', message: "업체 연결 해제 중 오류가 발생했습니다." });
    }
  };

  // 사용자 클릭 시 상세 뷰로 이동
  const handleUserClick = (user: InstagramUser) => {
    setSelectedUser(user);
    setView("USER_DETAIL");
    setContentPage(1);
    setContentFilter('all');
    setShowHidden(false);
    fetchContents(user.id, 1, 'all', false);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (filter: 'all' | 'place' | 'non-place') => {
    setContentFilter(filter);
    setContentPage(1);
    if (selectedUser) {
      fetchContents(selectedUser.id, 1, filter, showHidden);
    }
  };

  // 숨김 항목 필터 변경
  const handleToggleShowHidden = () => {
    const newValue = !showHidden;
    setShowHidden(newValue);
    setContentPage(1);
    if (selectedUser) {
      fetchContents(selectedUser.id, 1, contentFilter, newValue);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setContentPage(newPage);
    if (selectedUser) {
      fetchContents(selectedUser.id, newPage, contentFilter, showHidden);
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center">
          <button 
            onClick={() => {
              if (view === "USER_DETAIL") {
                setView("USER_LIST");
                setSelectedUser(null);
                fetchUsers();
              } else {
                navigate(-1);
              }
            }} 
            className="mr-3 p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold">인스타 파서</h1>
            {view === "USER_DETAIL" && selectedUser && (
              <p className="text-xs text-primary-600 font-medium">@{selectedUser.user_name} 관리 중</p>
            )}
          </div>
        </div>
        {view === "USER_LIST" && (
          <Button size="sm" onClick={() => {
            setShowAddUser(!showAddUser);
            setParsedUserData(null);
            setHeaderInput("");
          }} className="gap-2">
            {showAddUser ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {showAddUser ? "닫기" : "사용자 추가"}
          </Button>
        )}
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {appStatus && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
            appStatus.type === 'success' 
              ? "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 text-green-600" 
              : appStatus.type === 'error'
              ? "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600"
              : "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600"
          }`}>
            {appStatus.type === 'success' ? <Check className="w-4 h-4" /> : appStatus.type === 'error' ? <X className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
            {appStatus.message}
          </div>
        )}

        {view === "USER_LIST" ? (
          <div className="space-y-6">
            {/* 사용자 추가 섹션 */}
            {showAddUser && (
              <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 shadow-sm border border-surface-200 dark:border-surface-800 animate-in fade-in slide-in-from-top-4 duration-300">
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-surface-900 dark:text-surface-100">
                  <UserPlus className="w-4 h-4 text-primary-500" />
                  신규 사용자 등록
                </h2>
                <div className="space-y-4">
                <textarea
                  className="w-full h-32 p-3 border rounded-xl bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-base resize-none"
                  placeholder="사용자 정보 JSON (Header)을 붙여넣으세요..."
                    value={headerInput}
                    onChange={(e) => {
                      setHeaderInput(e.target.value);
                      setUserParseError(null);
                      setAppStatus(null);
                    }}
                  />

                  {userParseError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-xs text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1 whitespace-pre-line">
                      {userParseError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleParseUser}>분석</Button>
                    {parsedUserData && (
                      <Button className="flex-1" onClick={handleSaveUser} disabled={loading}>
                        {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "저장"}
                      </Button>
                    )}
                  </div>
                  
                  {parsedUserData && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-surface-500 ml-1">분석 결과 미리보기</h3>
                      <div className="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-surface-50 dark:bg-surface-800 text-surface-500 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-2 border-b border-surface-200 dark:border-surface-700">필드</th>
                              <th className="px-4 py-2 border-b border-surface-200 dark:border-surface-700">데이터</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            <tr>
                              <td className="px-4 py-2 font-medium bg-surface-50/50 dark:bg-surface-800/50 w-24">ID</td>
                              <td className="px-4 py-2 font-mono">{parsedUserData.id}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-medium bg-surface-50/50 dark:bg-surface-800/50">Username</td>
                              <td className="px-4 py-2 text-primary-600 font-bold">@{parsedUserData.user_name}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-medium bg-surface-50/50 dark:bg-surface-800/50">Full Name</td>
                              <td className="px-4 py-2">{parsedUserData.full_name}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-medium bg-surface-50/50 dark:bg-surface-800/50">Followers</td>
                              <td className="px-4 py-2">{parsedUserData.followers.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-medium bg-surface-50/50 dark:bg-surface-800/50">Bio</td>
                              <td className="px-4 py-2 text-surface-500 text-[11px] leading-relaxed">{parsedUserData.bio}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 사용자 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => handleUserClick(user)}
                  className="bg-white dark:bg-surface-900 p-4 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                        <User className="w-5 h-5 text-surface-500 group-hover:text-primary-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-surface-900 dark:text-white">@{user.user_name}</h3>
                        <p className="text-xs text-surface-500 line-clamp-1">{user.full_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-surface-900 dark:text-white">{user.followers.toLocaleString()}</p>
                      <p className="text-[10px] text-surface-400 uppercase">Followers</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-100 dark:border-surface-800">
                    <div className="text-center">
                      <p className="text-xs font-bold text-primary-600">{user.content_count}</p>
                      <p className="text-[10px] text-surface-400 uppercase">Content</p>
                    </div>
                    <div className="text-center border-x border-surface-100 dark:border-surface-800">
                      <p className="text-xs font-bold text-green-600">{user.place_filled_count}</p>
                      <p className="text-[10px] text-surface-400 uppercase">Places</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-surface-600 truncate">
                        {user.last_content_at ? new Date(user.last_content_at).toLocaleDateString() : "-"}
                      </p>
                      <p className="text-[10px] text-surface-400 uppercase">Latest</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {users.length === 0 && !loading && (
              <div className="py-20 text-center">
                <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">등록된 사용자가 없습니다.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            {/* 콘텐츠 추가 섹션 */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 shadow-sm border border-surface-200 dark:border-surface-800">
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-surface-900 dark:text-surface-100">
                <Plus className="w-4 h-4 text-primary-500" />
                새 콘텐츠 데이터 추가
              </h2>
              <div className="space-y-4">
                <textarea
                  className="w-full h-32 p-3 border rounded-xl bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-base resize-none"
                  placeholder="콘텐츠 목록 JSON (Feed)을 붙여넣으세요..."
                  value={contentInput}
                  onChange={(e) => {
                    setContentInput(e.target.value);
                    setParseError(null);
                    setAppStatus(null);
                  }}
                />
                
                {parseError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-xs text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1 whitespace-pre-line leading-relaxed">
                    {parseError}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleParseContent}>분석</Button>
                  {parsedContentList.length > 0 && (
                    <Button className="flex-1" onClick={handleSaveContents} disabled={loading}>
                      {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : `${parsedContentList.length}개 저장`}
                    </Button>
                  )}
                </div>

                {parsedContentList.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between ml-1">
                      <h3 className="text-xs font-bold text-surface-500">분석 결과 미리보기 ({parsedContentList.length})</h3>
                      <button 
                        onClick={() => setParsedContentList([])}
                        className="text-[10px] font-medium text-surface-400 hover:text-red-500 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> 초기화
                      </button>
                    </div>
                    <div className="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full text-left text-[11px] border-collapse relative">
                        <thead className="bg-surface-50 dark:bg-surface-800 text-surface-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 border-b border-surface-200 dark:border-surface-700">ID / Code</th>
                            <th className="px-3 py-2 border-b border-surface-200 dark:border-surface-700">Taken At</th>
                            <th className="px-3 py-2 border-b border-surface-200 dark:border-surface-700">Caption</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                          {parsedContentList.map((item) => (
                            <tr key={item.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                              <td className="px-3 py-2">
                                <div className="font-mono text-primary-600 dark:text-primary-400">{item.id.split('_')[0]}</div>
                                <div className="font-mono text-surface-400">{item.code}</div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-surface-600 dark:text-surface-400">
                                {new Date(item.taken_at).toLocaleString('ko-KR', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="px-3 py-2">
                                <p className="line-clamp-2 text-surface-500 max-w-[300px] leading-relaxed">
                                  {item.caption || <span className="text-surface-300 italic">No caption</span>}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 콘텐츠 목록 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-surface-900 dark:text-surface-100">
                  콘텐츠 목록 (전체 {contentTotalCount.toLocaleString()}개)
                </h2>
                <Button variant="ghost" size="sm" onClick={() => selectedUser && fetchContents(selectedUser.id, contentPage, contentFilter, showHidden)} className="h-8">
                  <RefreshCcw className="w-3 h-3 mr-1" /> 새로고침
                </Button>
              </div>

              {/* 필터 버튼 영역 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={contentFilter === 'all' ? 'primary' : 'outline'}
                    className="h-8 text-xs"
                    onClick={() => handleFilterChange('all')}
                  >
                    전체
                  </Button>
                  <Button
                    size="sm"
                    variant={contentFilter === 'place' ? 'primary' : 'outline'}
                    className="h-8 text-xs"
                    onClick={() => handleFilterChange('place')}
                  >
                    업체Y
                  </Button>
                  <Button
                    size="sm"
                    variant={contentFilter === 'non-place' ? 'primary' : 'outline'}
                    className="h-8 text-xs"
                    onClick={() => handleFilterChange('non-place')}
                  >
                    업체N
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant={showHidden ? 'secondary' : 'outline'}
                  className={cn("h-8 text-xs gap-1.5", showHidden && "bg-surface-200 text-surface-900")}
                  onClick={handleToggleShowHidden}
                >
                  {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {showHidden ? "숨김 항목 포함됨" : "숨김 항목 제외"}
                </Button>
              </div>

              {/* 페이징 */}
              {contentTotalCount > contentPageSize && (
                <div className="flex items-center justify-between text-xs text-surface-500">
                  <span>
                    {((contentPage - 1) * contentPageSize + 1).toLocaleString()} - {Math.min(contentPage * contentPageSize, contentTotalCount).toLocaleString()} / {contentTotalCount.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={contentPage === 1}
                      onClick={() => handlePageChange(contentPage - 1)}
                    >
                      이전
                    </Button>
                    <span className="text-xs">
                      {contentPage} / {Math.ceil(contentTotalCount / contentPageSize)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={contentPage >= Math.ceil(contentTotalCount / contentPageSize)}
                      onClick={() => handlePageChange(contentPage + 1)}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
              
              {contents.map(content => {
                const isExpanded = expandedContentId === content.id;

                return (
                  <div 
                    key={content.id}
                    className={`bg-white dark:bg-surface-900 rounded-2xl shadow-sm border transition-all ${
                      content.is_hidden ? "opacity-50 grayscale border-dashed" :
                      content.is_place === true ? "border-green-200 dark:border-green-900/30" : 
                      content.is_place === false ? "border-surface-200 dark:border-surface-800 opacity-70" :
                      "border-surface-200 dark:border-surface-800"
                    }`}
                  >
                    {/* 카드 헤더 (항상 노출) */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setExpandedContentId(isExpanded ? null : content.id)}
                          className="text-primary-600 font-mono text-xs font-bold hover:underline flex items-center gap-1"
                        >
                          {content.id.split('_')[0]}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">
                            {new Date(content.taken_at).toLocaleDateString()}
                          </span>
                          {content.is_place === true && (
                            <div className="flex flex-wrap gap-1">
                              {content.mapped_places && content.mapped_places.length > 0 ? (
                                content.mapped_places.map(p => (
                                  <span key={p.place_id} className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                                    <Store className="w-3 h-3" />
                                    {p.place_name}
                                  </span>
                                ))
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                                  <Store className="w-3 h-3" />
                                  업체
                                </span>
                              )}
                            </div>
                          )}
                          {content.is_place === false && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">
                              <MapPinOff className="w-3 h-3" />
                              비업체
                            </span>
                          )}
                          {content.is_hidden && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-surface-400 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">
                              <EyeOff className="w-3 h-3" />
                              숨김
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {content.is_place === null && !content.is_hidden && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 px-2 text-[10px] text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => {
                                setExpandedContentId(content.id);
                                setActiveContentId(content.id);
                                setSearchModalOpen(true);
                              }}
                            >
                              업체 지정
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 px-2 text-[10px] text-surface-500"
                              onClick={() => handleUpdateIsPlace(content.id, false)}
                            >
                              아니오
                            </Button>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-surface-400 hover:text-surface-600"
                          onClick={() => handleToggleHidden(content.id, content.is_hidden)}
                          title={content.is_hidden ? "숨김 해제" : "목록에서 숨기기"}
                        >
                          {content.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <a 
                          href={`https://www.instagram.com/p/${content.code}/`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 bg-surface-50 dark:bg-surface-800 rounded-lg text-surface-400 hover:text-primary-500 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* 확장 섹션 */}
                    {isExpanded && (
                      <div className="px-4 pb-4 animate-in fade-in duration-200">
                        <div className="p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-800 mb-4">
                          <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap">
                            {content.caption}
                          </p>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-surface-400 uppercase">연결된 업체 정보</span>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 px-3 text-[10px]"
                                onClick={() => {
                                  setActiveContentId(content.id);
                                  setSearchModalOpen(true);
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> 업체 추가
                              </Button>
                              <Button 
                                size="sm" 
                                variant={content.is_place === false ? "primary" : "outline"}
                                className="h-7 px-3 text-[10px]"
                                onClick={() => handleUpdateIsPlace(content.id, false)}
                              >
                                비업체 지정
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {content.mapped_places?.map(p => (
                              <div key={p.place_id} className="flex items-center gap-2 p-2 bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-xl">
                                <div className="w-10 h-10 rounded-lg bg-surface-50 dark:bg-surface-900 overflow-hidden flex-shrink-0">
                                  {p.thumbnail_url ? (
                                    <img src={convertToNaverResizeImageUrl(p.thumbnail_url)} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-surface-50 dark:bg-surface-900/50">
                                      <CookingPot className="w-5 h-5 text-surface-200 dark:text-surface-700 stroke-[1.2] opacity-50" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{p.place_name}</p>
                                  <p className="text-[10px] text-surface-400 font-mono">{p.place_id}</p>
                                </div>
                                <button 
                                  onClick={() => handleRemovePlace(content.id, p.place_id)}
                                  className="p-1.5 text-surface-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            {(!content.mapped_places || content.mapped_places.length === 0) && content.is_place === true && (
                              <div className="col-span-2 py-4 text-center border border-dashed border-surface-200 dark:border-surface-800 rounded-xl">
                                <p className="text-xs text-surface-400">연결된 업체가 없습니다. 업체를 추가해 주세요.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {contents.length === 0 && !loading && (
                <div className="py-20 text-center">
                  <FileText className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                  <p className="text-surface-500">등록된 콘텐츠가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-surface-900 p-4 rounded-2xl shadow-xl flex items-center gap-3">
            <RefreshCcw className="w-5 h-5 animate-spin text-primary-500" />
            <span className="text-sm font-bold">처리 중...</span>
          </div>
        </div>
      )}

      {/* 업체 검색 모달 */}
      <InstagramPlaceSearchModal 
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false);
          setActiveContentId(null);
        }}
        selectedIds={contents.find(c => c.id === activeContentId)?.mapped_places?.map(p => p.place_id) || []}
        caption={contents.find(c => c.id === activeContentId)?.caption}
        onSelect={(selectedPlaces) => {
          if (activeContentId) {
            handleAddPlaces(activeContentId, selectedPlaces);
          }
        }}
      />
    </div>
  );
}
