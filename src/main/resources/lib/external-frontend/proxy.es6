const portalLib = require('/lib/xp/portal');
const httpClientLib = require('/lib/http-client');

const {replaceUrls, baseUrlPageContributions} = require("./postProcess");

const MAPPING_TO_THIS_PROXY = '_ext_frontend_proxy';
const PROXY_MATCH_PATTERN = new RegExp(`^/?${MAPPING_TO_THIS_PROXY}(/.*)?$`);

let frontendOrigin = require('./connection-config').frontendOrigin       // "http://localhost:3000"
if (frontendOrigin.endsWith('/')) {
    frontendOrigin = frontendOrigin.slice(0, -1);
}




const loopbackCheckParam = '__fromXp__';





const errorResponse = function(url, status, message) {
    const msg = `Failed to fetch from frontend: ${url} - ${status}: ${message}`;
    if (status >= 400) {
        log.error(msg);
    }

    return {
        contentType: 'text/html',
        body: `<div>${msg}</div>`,
        status,
    };
};

// This proxies requests made directly to XP to the frontend. Normally this will
// only be used in the portal-admin content studio previews
const previewProxy = function(req) {



                                                                                                                        log.info("req (" +
                                                                                                                            (Array.isArray(req) ?
                                                                                                                                ("array[" + req.length + "]") :
                                                                                                                                (typeof req + (req && typeof req === 'object' ? (" with keys: " + JSON.stringify(Object.keys(req))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(req, null, 2)
                                                                                                                        );

    const site = portalLib.getSite();
    const sitePath = site._path;
    const siteUrl = portalLib.pageUrl({
        path: sitePath,
        type: 'server'
    })
        // Normalizing for variations in input and vhost: always end with vhost
        .replace(/\/*$/, '/');
                                                                                                                        log.info("siteUrl (" +
                                                                                                                            (Array.isArray(siteUrl) ?
                                                                                                                                ("array[" + siteUrl.length + "]") :
                                                                                                                                (typeof siteUrl + (siteUrl && typeof siteUrl === 'object' ? (" with keys: " + JSON.stringify(Object.keys(siteUrl))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(siteUrl, null, 2)
                                                                                                                        );
    if (!req.path.startsWith(siteUrl)) {
        throw Error("req.path " + JSON.stringify(req.path) + " was expected to start with siteUrl " + JSON.stringify(siteUrl));
    }
    const siteRelativeReqPath = req.path.substring(siteUrl.length)
        // Normalizing for variations in input and vhost: always start with a slash, never end with one (unless root)
        .replace(/\/*$/, '')
        .replace(/^\/*/, '/');
                                                                                                                        log.info("siteRelativeReqPath (" +
                                                                                                                            (Array.isArray(siteRelativeReqPath) ?
                                                                                                                                    ("array[" + siteRelativeReqPath.length + "]") :
                                                                                                                                    (typeof siteRelativeReqPath + (siteRelativeReqPath && typeof siteRelativeReqPath === 'object' ? (" with keys: " + JSON.stringify(Object.keys(siteRelativeReqPath))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(siteRelativeReqPath, null, 2)
                                                                                                                        );

    const content = portalLib.getContent();
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


    // FIXME: Until https://github.com/enonic/xp/issues/8530 is fixed, mappings aren't enough and this workaround is needed to detect if the path is pointing to a content item.
    const isContentItem = siteRelativeContentPath === siteRelativeReqPath;
    // Must be kept up to date with site.xml:s
    const nonContentProxyMatch = siteRelativeReqPath.match(PROXY_MATCH_PATTERN)
                                                                                                                        log.info("nonContentProxyMatch match (" +
                                                                                                                            (Array.isArray(nonContentProxyMatch) ?
                                                                                                                                ("array[" + nonContentProxyMatch.length + "]") :
                                                                                                                                (typeof nonContentProxyMatch + (nonContentProxyMatch && typeof nonContentProxyMatch === 'object' ? (" with keys: " + JSON.stringify(Object.keys(nonContentProxyMatch))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(nonContentProxyMatch, null, 2)
                                                                                                                        );

    if (!isContentItem && !nonContentProxyMatch) {
        return {
            status: 404
        };
    }

                                                                                                                        log.info("A-OKAY");
    let proxyPath;
    if (isContentItem) {
        const contentPathArr = content._path.split('/');
        proxyPath = content._path.split('/').slice((!contentPathArr[0]) ? 2 : 1).join("/");
    } else {
        proxyPath = nonContentProxyMatch[1] || '';
    }

                                                                                                                        log.info("----> proxyPath (" +
                                                                                                                            (Array.isArray(proxyPath) ?
                                                                                                                                ("array[" + proxyPath.length + "]") :
                                                                                                                                (typeof proxyPath + (proxyPath && typeof proxyPath === 'object' ? (" with keys: " + JSON.stringify(Object.keys(proxyPath))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(proxyPath, null, 2)
                                                                                                                        );


/*

    const isLoopback = req.params[loopbackCheckParam];
    if (isLoopback) {
        log.info(`Loopback to XP detected from path ${req.rawPath}`);
        return {
            contentType: 'text/html',
            body: `<div>Error: request to frontend looped back to XP</div>`,
            status: 200,
        };
    }
*/


                                                                                                                        log.info("content._path (" +
                                                                                                                        	(Array.isArray(content._path) ?
                                                                                                                        		("array[" + content._path.length + "]") :
                                                                                                                        		(typeof content._path + (content._path && typeof content._path === 'object' ? (" with keys: " + JSON.stringify(Object.keys(content._path))) : ""))
                                                                                                                        	) + "): " + JSON.stringify(content._path, null, 2)
                                                                                                                        );

    // - If the siteUrl is removed from req.path, and what's left is equal to content._path, then


    const params = req.params || {};
    params[loopbackCheckParam] = true;
    const paramsString = Object.keys(params)
        .map( key => `${key}=${params[key]}`)
        .join( '&');
    const frontendUrl = `${frontendOrigin}/${proxyPath}?${paramsString}`;

                                                                                                                        log.info("------------------\nfrontendUrl (" +
                                                                                                                            (Array.isArray(frontendUrl) ?
                                                                                                                                ("array[" + frontendUrl.length + "]") :
                                                                                                                                (typeof frontendUrl + (frontendUrl && typeof frontendUrl === 'object' ? (" with keys: " + JSON.stringify(Object.keys(frontendUrl))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(frontendUrl, null, 2)
                                                                                                                        );


    try {
        const response = httpClientLib.request({
            url: frontendUrl,
            contentType: 'text/html',
            connectionTimeout: 5000,
            headers: {
                //secret: "it's not a secret anymore!"
            },
            body: null, // JSON.stringify({ variables: {} }),
            followRedirects: req.mode !== 'edit',
        });



        if (!response) {
            return errorResponse(frontendUrl, 500, 'No response from HTTP client');
        }

        const status = response.status;
        const message = response.message;

        if (status >= 400) {
            log.info(`Error response from frontend for ${frontendUrl}: ${status} - ${message}`);
        }

        // Do not send redirect-responses to the content-studio editor view,
        // as it may cause iframe cross-origin errors
        if (req.mode === 'edit' && status >= 300 && status < 400) {
            return errorResponse(frontendUrl, status, 'Redirects are not supported in editor view');
        }

        const isHtml = response.status === 200 && response.contentType.indexOf('html') !== -1;
                                                                                                                        const logHtml = isHtml && req.mode !== 'live';
                                                                                                                        if (logHtml) {
                                                                                                                            const resp = {...response};
                                                                                                                            delete resp.body;
                                                                                                                            log.info("HTML response (" +
                                                                                                                                (Array.isArray(resp) ?
                                                                                                                                        ("array[" + resp.length + "]") :
                                                                                                                                        (typeof resp + (resp && typeof resp === 'object' ? (" with keys: " + JSON.stringify(Object.keys(resp))) : ""))
                                                                                                                                ) + "): " + JSON.stringify(resp, null, 2)
                                                                                                                            );

                                                                                                                        } else if (response.status !== 200) {
                                                                                                                            log.info("response (" +
                                                                                                                                (Array.isArray(response) ?
                                                                                                                                        ("array[" + response.length + "]") :
                                                                                                                                        (typeof response + (response && typeof response === 'object' ? (" with keys: " + JSON.stringify(Object.keys(response))) : ""))
                                                                                                                                ) + "): " + JSON.stringify(response, null, 2)
                                                                                                                            );
                                                                                                                        }


        if (isHtml) {
            response.body = replaceUrls(req, response.body, `${siteUrl}${MAPPING_TO_THIS_PROXY}/`,                                                                /*site._name, */                             logHtml);
            response.pageContributions = baseUrlPageContributions(response, siteUrl);
        }

        return response;

    } catch (e) {
        log.error(e);
        return errorResponse(frontendUrl, 500, `Exception: ${e}`);
    }
};

exports.get = previewProxy

exports.handleError = previewProxy;
