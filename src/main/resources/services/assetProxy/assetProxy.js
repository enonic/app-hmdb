const httpClient = require('/lib/http-client');

let frontendOrigin = require('../../lib/external-frontend/connection-config').frontendOrigin       // "http://localhost:3000"
if (frontendOrigin.endsWith('/')) {
    frontendOrigin = frontendOrigin.slice(0, -1);
}
const frontendOriginPattern = new RegExp(frontendOrigin, 'g');

const assetProxy = `/_/service/${app.name}/assetProxy`;

exports.get = (req) => {
    const headers = req.headers || {};
    delete headers['Accept'];
    delete headers['Content-Type'];
    log.info("------------------------\n" + JSON.stringify(req, null, 2))
    try {
        const path = req.rawPath.substring(req.contextPath.length);
        const params = Object.keys(req.params || {})
            .map(key => (req.params[key] === '')
                ? key
                : `${key}=${req.params[key]}`
            )
            .join('&');

        const url = `${frontendOrigin}/${path}${params ? `?${params}` : ''}`;

        log.info("Url:" + url)


        const response = httpClient.request({
            url: url,
            //contentType: 'text/html',
            connectionTimeout: 5000,
            headers: req.headers


            /*
            headers: {
                //secret: "it's not a secret anymore!"
            },
            body: null, // JSON.stringify({ variables: {} }),
            followRedirects: req.mode !== 'edit',
            */

        })

        if (response.status === 200) {
            log.info(JSON.stringify(response, null, 2))
            /*if (response.body) {
                response.body = response.body
                    //.replace(frontendOriginPattern, assetProxy)
                    .replace(frontendOriginPattern, "")
                    .replace(/([\s'",])\/_next\//g, "\$1" + assetProxy + "/_next/")
                    .replace(/([\s'",])\/api\//g, "\$1" + assetProxy + "/api/");
            }

            return response*/

        } else {
            log.warning(`${response.status}: ${JSON.stringify(response.message || response.body)} (${url})`);

            return {
                status: response.status,
                body: response.message || response.body,
                contentType: response.message ? 'text/plain; charset=UTF-8' : response.contentType || (response.headers || {}).contentType
            }
        }


    } catch (e) {
        log.error(e);
        return {
            status: 500,
            contentType: "text/plain; charset=UTF-8",
            body: "Server error - check the log on the server side."
        }
    }
}
