const guillotineLib = require('/lib/guillotine');
const graphQlLib = require('/lib/graphql');
const graphqlPlaygroundLib = require('/lib/graphql-playground');
const httpClient = require('/lib/http-client');

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

function fetchBookById(id) {
    try {
        const response = httpClient.request({
            url: `https://www.googleapis.com/books/v1/volumes/${id}`,
            method: 'GET',
            contentType: 'application/json',
            connectTimeout: 5000,
            readTimeout: 10000
        });
        if (response.status === 200) {
            const book = JSON.parse(response.body);
            const result = Object.create(book.volumeInfo);
            result.id = id;
            return result;
        }
    } catch (e) {
        log.error('Could not retrieve the book', e);
    }
    return null;
}

function createGoogleBookGraphQLObject(context) {
    const bookImageLinksType = context.schemaGenerator.createObjectType({
        name: 'BookImageLinks',
        fields: {
            smallThumbnail: {
                type: graphQlLib.GraphQLString,
            },
            thumbnail: {
                type: graphQlLib.GraphQLString,
            },
            small: {
                type: graphQlLib.GraphQLString,
            },
            medium: {
                type: graphQlLib.GraphQLString,
            },
            large: {
                type: graphQlLib.GraphQLString,
            },
            extraLarge: {
                type: graphQlLib.GraphQLString,
            },
        }
    });

    return context.schemaGenerator.createObjectType({
        name: 'GoogleBook',
        fields: {
            id: {
                type: graphQlLib.GraphQLString,
            },
            title: {
                type: graphQlLib.GraphQLString,
            },
            subtitle: {
                type: graphQlLib.GraphQLString,
            },
            authors: {
                type: graphQlLib.list(graphQlLib.GraphQLString),
            },
            publisher: {
                type: graphQlLib.GraphQLString,
            },
            publishedDate: {
                type: graphQlLib.GraphQLString,
            },
            description: {
                type: graphQlLib.GraphQLString,
            },
            pageCount: {
                type: graphQlLib.GraphQLInt,
            },
            language: {
                type: graphQlLib.GraphQLString,
            },
            averageRating: {
                type: graphQlLib.GraphQLFloat,
            },
            ratingsCount: {
                type: graphQlLib.GraphQLFloat,
            },
            imageLinks: {
                type: bookImageLinksType,
            }
        }
    });
}

function getSchemaOptions() {
    return {
        creationCallbacks: {
            'com_enonic_app_hmdb_GoogleBooksSelector_Data': (context, params) => {
                const bookType = createGoogleBookGraphQLObject(context);
                params.fields.googleBooks = {
                    type: graphQlLib.list(bookType),
                    resolve: (env) => {
                        const bookIds = env.source['googleBooks'];
                        const books = [];
                        (bookIds || []).forEach(bookId => {
                            books.push(fetchBookById(bookId))
                        });
                        return books;
                    }
                };
            },
        }
    };
}

exports.post = function (req) {
    const input = JSON.parse(req.body);

    const params = {
        query: input.query,
        variables: input.variables,
        schemaOptions: getSchemaOptions(),
    };

    return {
        contentType: 'application/json',
        headers: CORS_HEADERS,
        body: guillotineLib.execute(params)
    };
};

exports.webSocketEvent = guillotineLib.initWebSockets();
