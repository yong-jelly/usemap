import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import adapter from "svelte-adapter-bun";

export default {
    // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
    // for more information about preprocessors
    preprocess: [vitePreprocess({})],
    // alias: {
    //     '@lib': 'src/lib',
    //     '@services': 'src/lib/api/services',
    //     '@components': 'src/lib/components'
    // },
    kit: {
        adapter: adapter({
            port: 3000, // 운영 포트
            hostname: "0.0.0.0" // 모든 IP에서 접속 허용
        }),
        alias: {
            "@/*": "./src/lib/*",
        },
    }
};