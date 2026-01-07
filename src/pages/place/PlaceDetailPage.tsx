import { useParams } from "react-router";

/**
 * 장소 상세 정보 페이지 컴포넌트
 * 특정 장소의 모든 정보(메뉴, 리뷰, 위치 등)를 상세히 보여줍니다.
 */
export function PlaceDetailPage() {
  const { id } = useParams();
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">장소 상세</h1>
      <p className="text-surface-500 text-sm">ID: {id}</p>
      {/* TODO: 장소 상세 정보 구현 필요 */}
      <p className="text-surface-500 mt-2">장소 상세 페이지 준비 중...</p>
    </div>
  );
}
