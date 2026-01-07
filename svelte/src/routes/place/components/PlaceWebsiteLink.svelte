<script lang="ts">
	import { ExternalLink } from 'lucide-svelte';

	// Props: 웹사이트 URL
	const { website, text, bg_color } = $props<{ website?: string, text?: string, bg_color?: string }>();

	// URL 표시용 함수 (http/https, www 및 첫번째 슬러시 이후 모두 제거)
	function formatWebsiteUrl(url: string): string {
		// 먼저 http/https 및 www 제거
		const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
		// 첫번째 슬러시 이후 모두 제거하여 도메인만 표시
		const domain = cleanUrl.split('/')[0];
		
		// 특정 도메인에 대한 사용자 친화적인 텍스트 반환
		if (domain.includes('blog.naver.com')) {
			return '블로그';
		} else if (domain.includes('instagram.com')) {
			return '인스타그램';
		} else if (domain.includes('youtube.com')) {
			return '유튜브';
		} else if (domain.includes('modoo.at')) {
			return 'modoo!';
		} else if (domain.includes('smartstore.naver.com')) {
			return '스마트스토어';
		} else {
			return domain;
		}
	}

	// 클릭 가능한 URL 생성 함수 (http 없으면 추가)
	function getClickableUrl(url: string): string {
		return url.startsWith('http') ? url : `https://${url}`;
	}
</script>
{#if website}
	<div>
		<a 
			href={getClickableUrl(website)} 
			target="_blank" 
			rel="noopener noreferrer" 
			class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-900"
			style={`background-color: ${bg_color || 'gray-100'};`}
		>
			<ExternalLink class="h-3.5 w-3.5 flex-shrink-0" />
			<span>{text || formatWebsiteUrl(website)}</span>
		</a>
	</div>
{/if} 