const httpClientLib = require('/lib/http-client');

const { MAPPING_TO_THIS_PROXY } = require('./connection-config');
const { replaceUrls, baseUrlPageContributions } = require("./postprocessing");
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



                                                                                                                        log.info("req (" +
                                                                                                                            (Array.isArray(req) ?
                                                                                                                                ("array[" + req.length + "]") :
                                                                                                                                (typeof req + (req && typeof req === 'object' ? (" with keys: " + JSON.stringify(Object.keys(req))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(req, null, 2)
                                                                                                                        );


    const { frontendRequestPath, xpSiteUrl, error } = parseFrontendRequestPath(req);
    if (error) {
        return {
            status: error
        };
    }

                                                                                                                        /*

                                                                                                                            const isLoopback = req.params[LOOPBACKCHECKPARAM];
                                                                                                                            if (isLoopback) {
                                                                                                                                log.info(`Loopback to XP detected from path ${req.rawPath}`);
                                                                                                                                return {
                                                                                                                                    contentType: 'text/html',
                                                                                                                                    body: `<div>Error: request to frontend looped back to XP</div>`,
                                                                                                                                    status: 200,
                                                                                                                                };
                                                                                                                            }
                                                                                                                        */
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
            response.body = replaceUrls(req, response.body, `${xpSiteUrl}${MAPPING_TO_THIS_PROXY}/`,            logHtml);
            response.pageContributions = baseUrlPageContributions(response, xpSiteUrl);
        }

        return response;

    } catch (e) {
        log.error(e);
        return errorResponse(frontendUrl, 500, `Exception: ${e}`);
    }
};

exports.get = proxy

exports.handleError = proxy;
