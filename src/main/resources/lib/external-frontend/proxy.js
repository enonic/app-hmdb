const httpClient = require('/lib/http-client');

const frontendOrigin = require('./connection-config').frontendOrigin       // "http://localhost:3000"

const draftPathPrefix = require('./connection-config').draftPathPrefix     // _draft
const masterPathPrefix = require('./connection-config').masterPathPrefix   // _master

const loopbackCheckParam = '__fromXp__';

const prefix = {
    draft: draftPathPrefix,
    master: masterPathPrefix,
}

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


    const isLoopback = req.params[loopbackCheckParam];
    if (isLoopback) {
        log.info(`Loopback to XP detected from path ${req.rawPath}`);
        return {
            contentType: 'text/html',
            body: `<div>Error: request to frontend looped back to XP</div>`,
            status: 200,
        };
    }

                                                                                                                        log.info("req.rawPath (" +
                                                                                                                            (Array.isArray(req.rawPath) ?
                                                                                                                                    ("array[" + req.rawPath.length + "]") :
                                                                                                                                    (typeof req.rawPath + (req.rawPath && typeof req.rawPath === 'object' ? (" with keys: " + JSON.stringify(Object.keys(req.rawPath))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(req.rawPath, null, 2)
                                                                                                                        );

    const pathStartIndex = req.rawPath.indexOf(req.branch) + req.branch.length;

    // remove the paths of the raw path up until (and including) the branch name.
    //
    // for instance:
    // "/admin/site/inline/hmdb/draft/hmdb/persons/john-travolta"
    // becomes "/hmdb/persons/john-travolta".
    //
    // this way, we can more easily query for it with Guillotine
    const contentPath = req.rawPath.slice(pathStartIndex)

    log.info("contentPath (" +
    	(Array.isArray(contentPath) ?
    		("array[" + contentPath.length + "]") :
    		(typeof contentPath + (contentPath && typeof contentPath === 'object' ? (" with keys: " + JSON.stringify(Object.keys(contentPath))) : ""))
    	) + "): " + JSON.stringify(contentPath, null, 2)
    );

    const testFrontendUrl = `${frontendOrigin}/${prefix['master']}${contentPath}`;
    const frontendUrl = /* testFrontendUrl; /*/ `${frontendOrigin}/${prefix[req.branch]}${contentPath}?${loopbackCheckParam}=true`; //*/

                                                                                                                        log.info("frontendUrl (" +
                                                                                                                            (Array.isArray(frontendUrl) ?
                                                                                                                                ("array[" + frontendUrl.length + "]") :
                                                                                                                                (typeof frontendUrl + (frontendUrl && typeof frontendUrl === 'object' ? (" with keys: " + JSON.stringify(Object.keys(frontendUrl))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(frontendUrl, null, 2)
                                                                                                                        );

    try {
        const response = httpClient.request({
            url: frontendUrl,
            contentType: 'text/html',
            connectionTimeout: 5000,
            headers: {
                //secret: "it's not a secret anymore!"
            },
            body: null, // JSON.stringify({ variables: {} }),
            followRedirects: req.mode !== 'edit',
        });

                                                                                                                        log.info("response (" +
                                                                                                                            (Array.isArray(response) ?
                                                                                                                                ("array[" + response.length + "]") :
                                                                                                                                (typeof response + (response && typeof response === 'object' ? (" with keys: " + JSON.stringify(Object.keys(response))) : ""))
                                                                                                                            ) + "): " + JSON.stringify(response, null, 2)
                                                                                                                        );

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

        return response;

    } catch (e) {
        log.error(e);
        return errorResponse(frontendUrl, 500, `Exception: ${e}`);
    }

    return {
        contentType: 'text/html',
        body: `<div><p>Triggered the frontend proxy!</p></div>`,
        status: 200,
    };
};

exports.get = function(req) {
    const response = proxy(req);

                                                                                                                        log.info("FINAL response" + response);

    return response;
}

exports.handleError = proxy;
