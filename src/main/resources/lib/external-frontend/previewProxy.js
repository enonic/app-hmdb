const portalLib = require('/lib/xp/portal');
const httpClientLib = require('/lib/http-client');

let frontendOrigin = require('./connection-config').frontendOrigin       // "http://localhost:3000"
if (frontendOrigin.endsWith('/')) {
    frontendOrigin = frontendOrigin.slice(0, -1);
}
const frontendOriginPattern = new RegExp(frontendOrigin, 'g');
const assetProxy = `/_/service/${app.name}/assetProxy`;

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
const previewProxy = function(req) {

    const isLoopback = req.params[loopbackCheckParam];
    if (isLoopback) {
        log.info(`Loopback to XP detected from path ${req.rawPath}`);
        return {
            contentType: 'text/html',
            body: `<div>Error: request to frontend looped back to XP</div>`,
            status: 200,
        };
    }

    const content = portalLib.getContent();
    const contentPath = content._path;

    const frontendUrl = `${frontendOrigin}/${prefix[req.branch]}${contentPath}?${loopbackCheckParam}=true`;


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

        response.body = response.body
            //.replace(frontendOriginPattern, assetProxy)
            .replace(frontendOriginPattern, "")
            .replace(/([\s'",])\/_next\//g, "\$1" + assetProxy + "/_next/")
            .replace(/([\s'",])\/api\//g, "\$1" + assetProxy + "/api/")
        ;

        response.pageContributions = {
            headEnd: '<base href="http://localhost:8080/admin/site/inline/hmdb/draft/" />'
        }

        return response;

    } catch (e) {
        log.error(e);
        return errorResponse(frontendUrl, 500, `Exception: ${e}`);
    }
};

exports.get = function(req) {
    const response = previewProxy(req);

                                                                                                                        log.info("FINAL response:\n\n" + response.body+"\n");

    return response;
}

exports.handleError = previewProxy;
