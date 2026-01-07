import { Link } from "react-router";
import { Button } from "@/shared/ui";

/**
 * 404 에러 페이지 컴포넌트
 * 존재하지 않는 경로로 접근했을 때 표시됩니다.
 */
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <h1 className="text-6xl font-bold text-surface-200 mb-4">404</h1>
      <h2 className="text-xl font-bold mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-surface-500 mb-8">
        요청하신 페이지가 삭제되었거나 주소가 잘못되었습니다.
      </p>
      <Link to="/">
        <Button variant="primary">홈으로 돌아가기</Button>
      </Link>
    </div>
  );
}
