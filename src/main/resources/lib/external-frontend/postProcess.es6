const portalLib = require('/lib/xp/portal');

const {frontendOrigin} = require("./connection-config");

const nativeApiPattern = new RegExp(`(['"\`])(${frontendOrigin})?/(_next|api)/`, "g");

                                                                                                                        log.info("nativeApiPattern (" +
                                                                                                                            (Array.isArray(nativeApiPattern) ?
                                                                                                                                    ("array[" + nativeApiPattern.length + "]") :
                                                                                                                                    (typeof nativeApiPattern + (nativeApiPattern && typeof nativeApiPattern === 'object' ? (" with keys: " + JSON.stringify(Object.keys(nativeApiPattern))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(nativeApiPattern, null, 2)
                                                                                                                        );





/** Replace URL refs in both HTML, JS and JSON sources from pointing to frontend-urls to making them sub-urls below the extFrontendProxy service */
exports.replaceUrls = (req, body, baseUrl, logHtml) => {

    const serviceUrl = portalLib.serviceUrl({service: 'extFrontendProxy', type: 'server'});
    const extFrontendProxyRoot = `$1$2${serviceUrl}/$3/`;
                                                                                                                        log.info("extFrontendProxyRoot: " + extFrontendProxyRoot);

    let bodyReplaced = body
        // Replace local absolute root URLs (e.g. "/_next/..., "/api/... etc):
        .replace(nativeApiPattern, extFrontendProxyRoot);

    if (baseUrl) {
        bodyReplaced = bodyReplaced
            .replace(/"baseUrl":\s*(null|".*?")/g, `"baseUrl":"${baseUrl}"`)
    }
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
