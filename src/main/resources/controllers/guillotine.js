const contentLib = require('/lib/xp/content');
const guillotineLib = require('/lib/guillotine');
const graphQlLib = require('/lib/graphql');
const graphqlPlaygroundLib = require('/lib/graphql-playground');

//──────────────────────────────────────────────────────────────────────────────
// Constants
//──────────────────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': '*'
};

//──────────────────────────────────────────────────────────────────────────────
// Methods
//──────────────────────────────────────────────────────────────────────────────
exports.options = function () {
    return {
        contentType: 'text/plain;charset=utf-8',
        headers: CORS_HEADERS
    };
};

exports.get = function (req) {
    if (req.webSocket) {
        return {
            webSocket: {
                data: guillotineLib.createWebSocketData(req),
                subProtocols: ['graphql-ws']
            }
        };
    }

    let body = graphqlPlaygroundLib.render();
    return {
        contentType: 'text/html; charset=utf-8',
        body: body
    };
};

//-----------------------------------------------------------------------



var schema = guillotineLib.createSchema();





exports.post = function (req) {
    let input = JSON.parse(req.body);

    return {
        contentType: 'application/json',
        headers: CORS_HEADERS,
        body: JSON.stringify(graphQlLib.execute(schema, input.query, input.variables))
    };
};

exports.webSocketEvent = guillotineLib.initWebSockets();
