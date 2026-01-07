export function getCookie(name: string, cookieString: string | null) {
    console.log(`# getCookie ${name}, ${cookieString}`);
    if (!cookieString) return null;
    const matches = cookieString.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

export function setCookie(name: string, value: string, options: { path?: string, maxAge?: number } = {}) {
    console.log(`# setCookie ${name}, ${value}, ${options}`);
    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (const optionKey in options) {
        updatedCookie += "; " + optionKey;
        const optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}