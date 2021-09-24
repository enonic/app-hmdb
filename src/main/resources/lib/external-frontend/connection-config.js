exports.frontendOrigin = "http://localhost:3000"                                  // <- hardcode for poc.

exports.draftPathPrefix = "_draft";
exports.masterPathPrefix = "_master";


const frontendOriginPattern = new RegExp(`(['"\`])${exports.frontendOrigin}`, 'g');

const assetProxyUrl = `/_/service/${app.name}/extFrontendProxy`;

const extNativeRootPath = "_next"
const nativeRootPattern = new RegExp(`(['"\`])/${extNativeRootPath}/`, "g");
const assetProxyNativeRoot = `$1${assetProxyUrl}/${extNativeRootPath}/`

const extNativeApiPath = "api"
const nativeApiPattern = new RegExp(`(['"\`])/${extNativeApiPath}/`, "g");
const assetProxyNativeApi = `$1${assetProxyUrl}/${extNativeApiPath}/`

                                                                                                                        /*
                                                                                                                        log.info("assetProxyNextRoot (" +
                                                                                                                            (Array.isArray(assetProxyNextRoot) ?
                                                                                                                                    ("array[" + assetProxyNextRoot.length + "]") :
                                                                                                                                    (typeof assetProxyNextRoot + (assetProxyNextRoot && typeof assetProxyNextRoot === 'object' ? (" with keys: " + JSON.stringify(Object.keys(assetProxyNextRoot))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(assetProxyNextRoot, null, 2)
                                                                                                                        );
                                                                                                                        */
// Match <base href="X" and "baseUrl": "X" as long as X is /_master or /_draft followed by something or nothing before final quote.
// <base href= and "baseUrl": are caught in group 1, and the X-containing quotes in group 2 and 5.
const basePattern = new RegExp(`(<base\\s+href=|"baseUrl":\\s*)(['"])\\/(_draft|_master)(\\/+|\\/+.*?)?(['"])`, "g");


/** Replace URL refs in both HTML, JS and JSON sources from pointing to frontend-urls to making them sub-urls below the extFrontendProxy service */
exports.replaceUrls = (req, body) => body
    .replace(frontendOriginPattern, '$1')                   // <-- Remove protocol/domains
    .replace(basePattern, `$1$2${req.path}/$5`)             // <-- Replace <base="/ext/url/path" and "baseUrl": "/ext/url/path" with XP-local path
    .replace(nativeRootPattern, assetProxyNativeRoot)       // <-- Replace local absolute root URLs (e.g. "/_next/...
    .replace(nativeApiPattern, assetProxyNativeApi);        // <-- Replace local absolute api URLs (e.g. "/api/...
