const {frontendOrigin} = require("./connection-config")

const extRoot = frontendOrigin.replace(/\/*$/, '/');
const nativeApiPattern = new RegExp(`(['"\`])(${extRoot})(_next(?!/image\?)/|api/)`, "g");
const extRootPattern = new RegExp(`${extRoot}?`, "g");






/** Replace URL refs in both HTML, JS and JSON sources from pointing to frontend-urls to making them sub-urls below the extFrontendProxy service */
export const replaceUrls = (req, body, proxyUrl, logHtml) => {

    const extFrontendProxyRoot = `$1${proxyUrl}/$3/`;
                                                                                                                        //log.info("extFrontendProxyRoot: " + extFrontendProxyRoot);

    let bodyReplaced = body
        // Replace local absolute root URLs (e.g. "/_next/..., "/api/... etc):
        .replace(nativeApiPattern, extFrontendProxyRoot)
        .replace(extRootPattern, '')
                                                                                                                        if (logHtml) {
                                                                                                                            const pretty = bodyReplaced
                                                                                                                                // Format HTML a little for readability:
                                                                                                                                .replace(/<(\/.*?)>/g, '<$1>\n')
                                                                                                                                .replace(/<(?!\/.*?)>\s*<(?!\/)/g, '<$1>\n<')
                                                                                                                                // Format inline JSON a little for readability:
                                                                                                                                .replace(/":\s*([{\[])/g, '":$1\n')
                                                                                                                                .replace(/(["}\]]),\s*!/g, '$1,\n')
                                                                                                                                .replace(/\s*([}\]]),\s*!/g, '\n$1,\n')
                                                                                                                                .replace(/([{\[])\s*(["{\[])/g, '$1\n$2');

                                                                                                                            log.info("pretty HTML:\n\n" + (pretty) + "\n\n");
                                                                                                                        }

    return bodyReplaced;
}
