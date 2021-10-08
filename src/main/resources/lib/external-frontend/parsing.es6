const portalLib = require('/lib/xp/portal');

import { FRONTEND_ORIGIN, FROM_XP_PARAM, PROXY_MATCH_PATTERN } from "./connection-config";

const frontendOrigin = (FRONTEND_ORIGIN.endsWith('/'))
    ? FRONTEND_ORIGIN.slice(0, -1)
    : FRONTEND_ORIGIN




/**
 * Parses the site-relative path by CONTENT data:
 * current XP content path relative to the root site it appears to be below - naively based on the content._path string.
 * The returned string is normalized to always start with a slash and never end with a slash - unless it's the root site
 * item itself, in which case the return is '/'.
 *
 * Eg. for a content with _path value '/mysite/my/sub/item', returns '/my/sub/item'.
 *
 * @param content portal.getContent() object
 * @param sitePath ._path from portal.getSite()
 * @returns {string} Site relative content path
 */
const getSiteRelativeContentPath = (content, sitePath) => {
    if (!content._path.startsWith(sitePath)) {
        throw Error("content._path " + JSON.stringify(content._path) + " was expected to start with sitePath " + JSON.stringify(sitePath));
    }
    const siteRelativeContentPath = content._path.substring(sitePath.length)
        // Normalizing for variations in input and vhost: always start with a slash, never end with one (unless root)
        .replace(/\/*$/, '')
        .replace(/^\/*/, '/');
                                                                                                                        log.info("siteRelativeContentPath (" +
                                                                                                                            (Array.isArray(siteRelativeContentPath) ?
                                                                                                                                    ("array[" + siteRelativeContentPath.length + "]") :
                                                                                                                                    (typeof siteRelativeContentPath + (siteRelativeContentPath && typeof siteRelativeContentPath === 'object' ? (" with keys: " + JSON.stringify(Object.keys(siteRelativeContentPath))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(siteRelativeContentPath, null, 2)
                                                                                                                        );
    return siteRelativeContentPath;
}



/**
 * Parses the site-relative path by REQUEST data:
 * current request.path relative to the root site's XP url in the current context.
 * Exception: 'edit' view mode, where ID is used instead of content._path, this deviation is handled here and site-relative path is still returned.
 * The returned string is normalized to always start with a slash and never end with a slash - unless it's the root site
 * item itself, in which case the return is '/'.
 *
 * Eg. for the request path 'site/default/draft/mysite/my/sub/item', returns '/my/sub/item'.
 *
 * @param req Request object
 * @param xpSiteUrl Root site url in the current context (view mode, vhosting etc), must be normalized to always end with exactly one slash
 * @param site
 * @returns {string} Site relative request path
 *
 * @throws {Error} Error if the request path doesn't start with site path, except in 'edit' view mode
 */
const getSiteRelativeRequestPath = (req, xpSiteUrl, site, content, siteRelativeContentPath) => {
    let siteRelativeReqPath = null;
    if (!req.path.startsWith(xpSiteUrl)) {
        if (req.path.replace(/\/*$/, '/') === xpSiteUrl) {
            // On root site content item, detects slash deviation and just returns the root slash
            siteRelativeReqPath = '/';

        } else if (req.mode === 'edit') {
            // In edit mode, look for ID match between request path and the content ID, and fall back to previously detected siteRelativeContentPath
            const editRootUrl = xpSiteUrl.replace(new RegExp(`${site._name}/$`), '');
            if (req.path === `${editRootUrl}${content._id}`) {
                siteRelativeReqPath = siteRelativeContentPath;

            } else {
                throw Error("req.path " + JSON.stringify(req.path) + " not recognized with _path or _id.");
            }

        } else {
            throw Error("req.path " + JSON.stringify(req.path) + " was expected to start with xpSiteUrl " + JSON.stringify(xpSiteUrl));
        }

    } else {
        siteRelativeReqPath = req.path.substring(xpSiteUrl.length)
            // Normalizing for variations in input and vhost: always start with a slash, never end with one (unless root)
            .replace(/\/*$/, '')
            .replace(/^\/*/, '/');
    }
                                                                                                                        log.info("siteRelativeReqPath (" +
                                                                                                                            (Array.isArray(siteRelativeReqPath) ?
                                                                                                                                    ("array[" + siteRelativeReqPath.length + "]") :
                                                                                                                                    (typeof siteRelativeReqPath + (siteRelativeReqPath && typeof siteRelativeReqPath === 'object' ? (" with keys: " + JSON.stringify(Object.keys(siteRelativeReqPath))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(siteRelativeReqPath, null, 2)
                                                                                                                        );

    return siteRelativeReqPath;
}




/** Uses request, site and content data to determine the frontendserver-relative path to pass on through the proxy: whatever path to a page (xp-content or not), frontend asset etc., that the proxy should request.
 *
 *      FIXME: Until https://github.com/enonic/xp/issues/8530 is fixed, mappings aren't enough, and this workaround is needed to detect if the path is pointing to a content item:
 *          - isContentItem is true if the this proxy is triggered by an existing-contentitem (of not-media type, but that
 *              depends on mapping) path, false if the path points to a non-existing content-item (or media:*, but that shouldn't
 *              trigger this controller at all) or the proxyMatchPattern (which should also be handled by mapping in site.xml,
 *              but isn't since this controller is also triggered by non-content paths.
 *          - nonContentPath: whenever this proxy is triggered on a non-existing content, the path is matched for proxyMatchPattern,
 *              and anything after that is captured in group 1 - aka nonContentPath[1]. If no match (or empty path after it),
 *              nonContentPath is an empty array, falsy and nonContentPath[1] is undefined.
 *
 * @param req {{path: string, mode: string}} XP request object
 * @return {{xpSiteUrl: *, frontendRequestPath: string}|{error: number}}
 *          xpSiteUrl: domain-less URL to the root site in the current calling context (vhost, XP view mode etc), and normalized to always end with a slash. Eg. /site/hmdb/draft/hmdb/
 *          frontendRequestPath: frontendserver-relative path to pass on through the proxy: whatever path to a page (xp-content or not), frontend asset etc., that the proxy should request.
 *          error: HTTP status error code.
 */
export const parseFrontendRequestPath = (req) => {

    const site = portalLib.getSite();
    const content = portalLib.getContent();

    const xpSiteUrl = portalLib.pageUrl({
        path: site._path,
        type: 'server'
    })
        // Normalizing for variations in input and vhosting: always end with exactly one slash
        .replace(/\/*$/, '/');

                                                                                                                        log.info("xpSiteUrl (" +
                                                                                                                            (Array.isArray(xpSiteUrl) ?
                                                                                                                                    ("array[" + xpSiteUrl.length + "]") :
                                                                                                                                    (typeof xpSiteUrl + (xpSiteUrl && typeof xpSiteUrl === 'object' ? (" with keys: " + JSON.stringify(Object.keys(xpSiteUrl))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(xpSiteUrl, null, 2)
                                                                                                                        );


    // Without actual mapping (until https://github.com/enonic/xp/issues/8530 is fixed), it's handled like this:
    // Compare: do the request and the current content agree on what's the relative path?
    // If yes, it's a content item path: pass it directly to the frontend.
    // If no, it's either a non-existing content (return a 404), or it's <domain>/<siteUrl>/<proxyMatchPattern>/<frontendRequestPath>. Use nonContentPath to determine <frontendRequestPath> and pass that to the frontend.
    const siteRelativeContentPath = getSiteRelativeContentPath(content, site._path);
    const siteRelativeReqPath = getSiteRelativeRequestPath(req, xpSiteUrl, site, content, siteRelativeContentPath);

    const isContentItem = siteRelativeContentPath === siteRelativeReqPath;

    const nonContentPath = siteRelativeReqPath.match(PROXY_MATCH_PATTERN)
                                                                                                                        log.info("nonContentPath match (" +
                                                                                                                            (Array.isArray(nonContentPath) ?
                                                                                                                                    ("array[" + nonContentPath.length + "]") :
                                                                                                                                    (typeof nonContentPath + (nonContentPath && typeof nonContentPath === 'object' ? (" with keys: " + JSON.stringify(Object.keys(nonContentPath))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(nonContentPath, null, 2)
                                                                                                                        );

    if (!isContentItem && !nonContentPath) {
        return {
            error: 404
        };
    }


                                                                                                                        log.info("A-OKAY");
    let frontendRequestPath;
    if (isContentItem) {
        const contentPathArr = content._path.split('/');
        frontendRequestPath = contentPathArr
            .slice( (!contentPathArr[0])
                ? 2
                : 1
            )
            .join("/");
    } else {
        frontendRequestPath = nonContentPath[1] || '';
    }

                                                                                                                        log.info("----> frontendRequestPath (" +
                                                                                                                            (Array.isArray(frontendRequestPath) ?
                                                                                                                                    ("array[" + frontendRequestPath.length + "]") :
                                                                                                                                    (typeof frontendRequestPath + (frontendRequestPath && typeof frontendRequestPath === 'object' ? (" with keys: " + JSON.stringify(Object.keys(frontendRequestPath))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(frontendRequestPath, null, 2)
                                                                                                                        );

    return {
        frontendRequestPath,
        xpSiteUrl
    }
}


export const parseFrontendUrl = (req, frontendRequestPath) => {
    const params = req.params || {};
    params[FROM_XP_PARAM] = true;
    const paramsString = Object.keys(params)
        .map( key => `${key}=${params[key]}`)
        .join( '&');

    const frontendUrl = `${frontendOrigin}/${frontendRequestPath}?${paramsString}`.replace(/\/+/g, '/');

                                                                                                                        log.info("------------------\nfrontendUrl (" +
                                                                                                                            (Array.isArray(frontendUrl) ?
                                                                                                                                    ("array[" + frontendUrl.length + "]") :
                                                                                                                                    (typeof frontendUrl + (frontendUrl && typeof frontendUrl === 'object' ? (" with keys: " + JSON.stringify(Object.keys(frontendUrl))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(frontendUrl, null, 2)
                                                                                                                        );
    return frontendUrl;
}

