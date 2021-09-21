const httpClient = require('/lib/http-client');

const frontendOrigin = require('../../lib/external-frontend/connection-config').frontendOrigin       // "http://localhost:3000"

exports.get = (req) => {
    try {
        const path = req.rawPath.substring(req.contextPath.length);
        const params = Object.keys(req.params || {})
            .map(key => (req.params[key] === '')
                ? key
                : `${key}=${req.params[key]}`
            )
            .join('&');

        const url = `${frontendOrigin}${path}${params ? `?${params}` : ''}`;

        const response = httpClient.request({
            url: url,
            contentType: 'text/html',
            connectionTimeout: 5000,

            /*
            headers: {
                //secret: "it's not a secret anymore!"
            },
            body: null, // JSON.stringify({ variables: {} }),
            followRedirects: req.mode !== 'edit',
            */

        })

        return response

    } catch (e) {
        log.error(e);
        return {
            status: 500,
            contentType: "text/plain; charset=UTF-8",
            body:  "Server error - check the log on the server side."
        }
    }
}
