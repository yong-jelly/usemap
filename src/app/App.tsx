import { Providers } from "./providers";
import { AppRouter } from "./router";

/**
 * 루트 애플리케이션 컴포넌트
 * 전역 프로바이더와 라우터를 결합합니다.
 */
export function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
