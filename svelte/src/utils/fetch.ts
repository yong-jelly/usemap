import { get } from 'svelte/store';
import { authStore } from '../stores';

const DEV_PORT = 3002;
export async function execute(input: RequestInfo, init?: RequestInit): Promise<Response> {
    let url = input instanceof Request ? input.url : input;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const host = `${window.location.protocol}//${window.location.hostname}:${DEV_PORT}`;
        url = `${host}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    return await fetch(url, init);
}

export async function executeFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return await fetch(input, init);
}
export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return await fetch(input, init);
}
    
// export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
//     const { accessToken } = get(authStore);
//     // console.log(accessToken)

//     const headers = new Headers(init?.headers || {});
//     if (accessToken) {
//         headers.set('Authorization', `Bearer ${accessToken}`);
//     }

//     const modifiedInit = {
//         ...init,
//         headers,
//     };

//     return fetch(input, modifiedInit);
// }