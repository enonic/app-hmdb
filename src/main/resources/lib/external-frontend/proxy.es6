const httpClientLib = require('/lib/http-client');

const { getBodyWithReplacedUrls, getPageContributionsWithBaseUrl } = require("./postprocessing");
const { parseFrontendUrl, parseFrontendRequestPath } = require("./parsing");





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



// This proxies both requests made to XP content item paths and to frontend-relative paths (below the proxy "mapping" MAPPING_TO_THIS_PROXY),
// and uses httpClientLib to make the same request from the frontend, whether its rendered HTML or frontend assets.
const proxy = function(req) {

    /*
    const { FROM_XP_PARAM } = require('./connection-config');
    const isLoopback = req.params[FROM_XP_PARAM];
    if (isLoopback) {
        log.info(`Loopback to XP detected from path ${req.rawPath}`);
        return {
            contentType: 'text/html',
            body: `<div>Error: request to frontend looped back to XP</div>`,
            status: 200,
        };
    }
    */

    const { frontendRequestPath, xpSiteRootUrl } = parseFrontendRequestPath(req);

                                                                                                                        log.info("frontendRequestPath (" +
                                                                                                                            (Array.isArray(frontendRequestPath) ?
                                                                                                                                ("array[" + frontendRequestPath.length + "]") :
                                                                                                                                (typeof frontendRequestPath + (frontendRequestPath && typeof frontendRequestPath === 'object' ? (" with keys: " + JSON.stringify(Object.keys(frontendRequestPath))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(frontendRequestPath, null, 2)
                                                                                                                        );

    const frontendUrl = parseFrontendUrl(req, frontendRequestPath);

    try {
        const response = httpClientLib.request({
            url: frontendUrl,
            // contentType: 'text/html',
            connectionTimeout: 5000,
/*            headers: {
                //secret: "it's not a secret anymore!"
            },*/
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

        const isOk =  response.status === 200;
        const isHtml = isOk && response.contentType.indexOf('html') !== -1;
        const isJs = isOk && response.contentType.indexOf('javascript') !== -1;

        if (isHtml || isJs) {
            response.body = getBodyWithReplacedUrls(req, response.body, xpSiteRootUrl);
        }

        if (isHtml) {
            response.pageContributions = getPageContributionsWithBaseUrl(response, xpSiteRootUrl);
        } else {
            response.postProcess = false
        }

                                                                                                                                log.info("Ok.");
        return response;

    } catch (e) {
        log.error(e);
        return errorResponse(frontendUrl, 500, `Exception: ${e}`);
    }
};

exports.get = proxy

exports.handleError = proxy;
