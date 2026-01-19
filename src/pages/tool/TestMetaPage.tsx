import React, { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Card } from "@/shared/ui/Card";
import { ChevronLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";

export function TestMetaPage() {
  const [url, setUrl] = useState("https://www.threads.com/@parkyeny/post/DTqBP28E1GO?xmt=AQF0urH7H4wQBPb18k2_uEj_tGlj1YbMySH60cBnoLXjwkvOEk7_-uYq5hYSCiRdiC07TpTK&slof=1");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    meta?: Record<string, string>;
    error?: string;
  } | null>(null);

  const navigate = useNavigate();

  const handleFetch = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      console.log("Fetching URL:", url);
      // 클라이언트 사이드 fetch 시도
      const response = await fetch(url, {
        method: "GET",
        mode: "cors", // CORS 정책 확인을 위해 명시
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const metaTags = doc.querySelectorAll("meta");
      const meta: Record<string, string> = {};
      
      metaTags.forEach((tag) => {
        const key = tag.getAttribute("property") || tag.getAttribute("name") || tag.getAttribute("http-equiv");
        const content = tag.getAttribute("content");
        if (key && content) {
          meta[key] = content;
        }
      });

      setResult({
        status: response.status,
        statusText: response.statusText,
        headers,
        meta,
      });
    } catch (error: any) {
      console.error("Fetch error:", error);
      setResult({
        error: error.message || "알 수 없는 오류가 발생했습니다. (아마도 CORS 문제일 가능성이 높습니다)",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="sticky top-0 z-10 flex items-center p-4 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-3 p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">메타 정보 조회 테스트</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full space-y-6">
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-surface-600">조회할 URL</label>
            <Input 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="https://..."
              className="font-mono text-sm"
            />
          </div>
          <Button 
            onClick={handleFetch} 
            disabled={isLoading || !url} 
            className="w-full font-bold"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            클라이언트에서 직접 조회 시도
          </Button>
          <p className="text-[11px] text-surface-500 bg-surface-100 dark:bg-surface-800 p-2 rounded-lg leading-relaxed">
            💡 <strong>주의:</strong> 브라우저 정책상 대부분의 외부 도메인은 CORS(Cross-Origin Resource Sharing) 설정에 의해 직접 fetch가 차단됩니다. 
            만약 실패한다면 이는 서버(Threads)에서 브라우저의 직접 접근을 허용하지 않기 때문입니다.
          </p>
        </Card>

        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {result.error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-red-600 dark:text-red-400">조회 실패</h3>
                  <p className="text-sm text-red-500 dark:text-red-400/80 mt-1 whitespace-pre-wrap">{result.error}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-600 dark:text-green-400">조회 성공 (Status: {result.status})</h3>
                  <p className="text-sm text-green-500 dark:text-green-400/80 mt-1">데이터를 성공적으로 가져왔습니다.</p>
                </div>
              </div>
            )}

            {result.meta && Object.keys(result.meta).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-surface-600 ml-1">추출된 메타 정보</h3>
                <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-surface-50 dark:bg-surface-800 text-surface-500 font-bold">
                      <tr>
                        <th className="px-4 py-2 border-b border-surface-200 dark:border-surface-700">Property/Name</th>
                        <th className="px-4 py-2 border-b border-surface-200 dark:border-surface-700">Content</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                      {Object.entries(result.meta).map(([key, value]) => (
                        <tr key={key}>
                          <td className="px-4 py-2 font-medium text-primary-600 dark:text-primary-400 break-all">{key}</td>
                          <td className="px-4 py-2 text-surface-600 dark:text-surface-400 break-all">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.headers && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-surface-600 ml-1">응답 헤더</h3>
                <div className="bg-surface-100 dark:bg-surface-800/50 p-4 rounded-2xl overflow-x-auto">
                  <pre className="text-[10px] font-mono text-surface-500 leading-relaxed">
                    {JSON.stringify(result.headers, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
