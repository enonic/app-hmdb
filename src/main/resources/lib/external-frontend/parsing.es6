const portalLib = require('/lib/xp/portal');

import { FRONTEND_ORIGIN, FROM_XP_PARAM } from "./connection-config";

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
 * @param contentPath ._path from portal.getContent()
 * @param sitePath ._path from portal.getSite()
 * @returns {string} Site relative content path
 */
const getSiteRelativeContentPath = (contentPath, sitePath) => {
    if (!contentPath.startsWith(sitePath)) {
        throw Error("content._path " + JSON.stringify(contentPath) + " was expected to start with sitePath " + JSON.stringify(sitePath));
    }
    return contentPath.substring(sitePath.length)
        // Normalizing for variations in input and vhost: always start with a slash, never end with one (unless root)
        .replace(/\/*$/, '')
        .replace(/^\/*/, '/');
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
 * @param xpSiteRootUrl Root site url in the current context (view mode, vhosting etc) - normalized to always end with exactly one slash
 * @param siteName _name from portal.getSite()
 * @param contentId _id from portal.getContent()
 * @param siteRelativeContentPath output from getSiteRelativeContentPath() above
 * @returns {string} Site relative request path
 *
 * @throws {Error} Error if the request path doesn't start with site path, except in 'edit' view mode
 */
const getFrontendRequestPath = (req, xpSiteRootUrl, siteName, contentId, siteRelativeContentPath) => {
    if (!req.path.startsWith(xpSiteRootUrl)) {
        if (req.path.replace(/\/*$/, '/') === xpSiteRootUrl) {
            // On root site content item, detects slash deviation and just returns the root slash
            return '/';

        } else if (req.mode === 'edit') {
            // In edit mode, look for ID match between request path and the content ID, and fall back to previously detected siteRelativeContentPath
            const editRootUrl = xpSiteRootUrl.replace(new RegExp(`${siteName}/$`), '');
            if (req.path === `${editRootUrl}${contentId}`) {
                return siteRelativeContentPath;

            } else {
                throw Error("req.path " + JSON.stringify(req.path) + " not recognized with _path or _id.");
            }

        } else {
            throw Error("req.path " + JSON.stringify(req.path) + " was expected to start with xpSiteRootUrl " + JSON.stringify(xpSiteRootUrl));
        }

    } else {
        return req.path.substring(xpSiteRootUrl.length)
            // Normalizing for variations in input and vhost: always start with a slash, never end with one (unless root)
            .replace(/\/*$/, '')
            .replace(/^\/*/, '/');
    }
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
 * @return {{xpSiteRootUrl: *, frontendRequestPath: string}|{error: number}}
 *          xpSiteRootUrl: domain-less URL to the root site in the current calling context (vhost, XP view mode etc), and normalized to always end with a slash. Eg. /site/hmdb/draft/hmdb/
 *          frontendRequestPath: frontendserver-relative path to pass on through the proxy: whatever path to a page (xp-content or not), frontend asset etc., that the proxy should request.
 *          error: HTTP status error code.
 */
export const parseFrontendRequestPath = (req) => {

    const site = portalLib.getSite();
    const content = portalLib.getContent();

    const xpSiteRootUrl = portalLib.pageUrl({
        path: site._path,
        type: 'server'
    })
        // Normalizing for any variation in input and vhosting: always end with exactly one slash
        .replace(/\/*$/, '/');

    const siteRelativeContentPath = getSiteRelativeContentPath(content._path, site._path);
    const frontendRequestPath = getFrontendRequestPath(req, xpSiteRootUrl, site._name, content._id, siteRelativeContentPath);

    return {
        frontendRequestPath,
        xpSiteRootUrl
    }
}




export const parseFrontendUrl = (req, frontendRequestPath) => {
    const params = req.params || {};
    params[FROM_XP_PARAM] = true;
    const paramsString = Object.keys(params)
        .map( key => `${key}=${params[key]}`)
        .join( '&');

    return `${frontendOrigin}/${frontendRequestPath}?${paramsString}`.replace(/\/+/g, '/');
}

