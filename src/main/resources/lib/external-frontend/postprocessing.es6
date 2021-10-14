const {FRONTEND_ORIGIN} = require("./connection-config")

//const nextDomainDevPattern = new RegExp("(var\\s+nextDomain\\s*=\\s*\\\\?['\"])" + FRONTEND_ORIGIN + "(\\\\?['\"])", "g");

const extRoot = FRONTEND_ORIGIN.replace(/\/*$/, '/');
const nativeApiPattern = new RegExp(`(['"\`])(${extRoot})(_next(?!/image\?)/|api/)`, "g");
const extRootPattern = new RegExp(`${extRoot}?`, "g");






/** Replace URL refs in both HTML, JS and JSON sources from pointing to frontend-urls to making them sub-urls below the extFrontendProxy service */
export const getBodyWithReplacedUrls = (req, body, proxyUrlWithSlash) => {

    const extFrontendProxyRoot = `$1${req.scheme}://${req.headers.Host}${proxyUrlWithSlash}$3`;

    return body
                                                                                                    //.replace(nextDomainDevPattern, "$1$2")
        // Replace local absolute root URLs (e.g. "/_next/..., "/api/... etc):
        .replace(nativeApiPattern, extFrontendProxyRoot)
        .replace(extRootPattern, proxyUrlWithSlash)

                                                                                                                        // Debugging:
                                                                                                                        //.replace(/(__webpack_require__\.p = ['"])http:\/\/hmdb-draft:8080\/_next(\/?['"];)/g, "$1//Heyoooo$2 console.log('__webpack_require__.p set to:', __webpack_require__.p);")
                                                                                                                        .replace(/(__webpack_require__\.p\s*=\s*\\")(\\")\.concat\(prefix,\s*\\"\/_next\/\\"\)/g, `$1${req.scheme}://${req.headers.Host}/_next/$2; console.log('__webpack_require__.p CHANGED to:', __webpack_require__.p)`)
                                                                                                                        .replace(/(var url = __webpack_require__\.p \+ __webpack_require__.u\(chunkId\);)/g, "console.log('__webpack_require__.p:', __webpack_require__.p); console.log('chunkId:', chunkId); $1 console.log('URL:', url); ")
}




export const getPageContributionsWithBaseUrl = (response, siteUrl) => {
    const pageContributions = response.pageContributions || {};
    return {
        ...pageContributions,
        headBegin: [
            ...(
                (typeof pageContributions.headBegin === 'string')
                    ?  [pageContributions.headBegin]
                    :  pageContributions.headBegin || []
            ).map(item => item.replace(/<base\s+.*?(\/>|\/base>)/g, '')),
            `<base href="${siteUrl}" />`
        ]
    };
}
