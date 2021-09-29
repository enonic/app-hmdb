const portalLib = require('/lib/xp/portal');
const httpClientLib = require('/lib/http-client');

const {replaceUrls} = require("./postProcess");

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
const proxy = function(req) {



                                                                                                                        log.info("req (" +
                                                                                                                            (Array.isArray(req) ?
                                                                                                                                ("array[" + req.length + "]") :
                                                                                                                                (typeof req + (req && typeof req === 'object' ? (" with keys: " + JSON.stringify(Object.keys(req))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(req, null, 2)
                                                                                                                        );

    const sitePath = portalLib.getSite()._path;
    const siteUrl = portalLib.pageUrl({
        path: sitePath,
        type: 'server'
    });
    const baseUrl = `${siteUrl}/`;


    const isLoopback = req.params[loopbackCheckParam];
    if (isLoopback) {
        log.info(`Loopback to XP detected from path ${req.rawPath}`);
        return {
            contentType: 'text/html',
            body: `<div>Error: request to frontend looped back to XP</div>`,
            status: 200,
        };
    }

    // Fetch content path with the site name stripped away
    const contentPathArr = portalLib.getContent()._path.split('/');
    const contentSubPath = contentPathArr.slice((!contentPathArr[0]) ? 2 : 1).join("/");

    const frontendUrl = `${frontendOrigin}/${contentSubPath}?${loopbackCheckParam}=true`;

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

                                                                                                                        const logHtml = response.status === 200 && response.contentType.indexOf('html') !== -1 && req.mode !== 'live';
                                                                                                                        if (logHtml) {
                                                                                                                            const resp = {...response};
                                                                                                                            delete resp.body;
                                                                                                                            log.info("HTML response (" +
                                                                                                                                (Array.isArray(resp) ?
                                                                                                                                        ("array[" + resp.length + "]") :
                                                                                                                                        (typeof resp + (resp && typeof resp === 'object' ? (" with keys: " + JSON.stringify(Object.keys(resp))) : ""))
                                                                                                                                ) + "): " + JSON.stringify(resp, null, 2)
                                                                                                                            );

                                                                                                                        } else {
                                                                                                                            log.info("response (" +
                                                                                                                                (Array.isArray(response) ?
                                                                                                                                        ("array[" + response.length + "]") :
                                                                                                                                        (typeof response + (response && typeof response === 'object' ? (" with keys: " + JSON.stringify(Object.keys(response))) : ""))
                                                                                                                                ) + "): " + JSON.stringify(response, null, 2)
                                                                                                                            );
                                                                                                                        }

        response.body = replaceUrls(req, response.body, baseUrl,                                                        logHtml);

        const pageContributions = response.pageContributions || {};
        response.pageContributions = {
            ...pageContributions,
            headEnd: [
                ...(
                    (typeof pageContributions.headEnd === 'string')
                        ?  [pageContributions.headEnd]
                        :  pageContributions.headEnd || []
                ).map(item => item.replace(/<base\s+.*?(\/>|\/base>)/g, '')),
                `<base href="${baseUrl}" />`
            ]
        }
        return response;

    } catch (e) {
        log.error(e);
        return errorResponse(frontendUrl, 500, `Exception: ${e}`);
    }
};

exports.get = function(req) {
    const response = proxy(req);

                                                                                                                        // log.info("FINAL response" + response.body);

    return response;
}

exports.handleError = proxy;
