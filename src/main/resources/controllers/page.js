var portal = require('/lib/xp/portal');

exports.get = function (req) {
    var title = "Headless Movie Database";
    var assetUrl = portal.assetUrl({
        path: 'styles.css'
      });
    var baseUrl = req.scheme+"://"+req.host+":"+req.port;
    var draftApi = baseUrl+"/site/default/draft/hmdb/api";
    var masterApi = baseUrl+"/site/default/master/hmdb/api";
    return  {
    body: `
  <html>
    <head>
      <title>${title}</title>
      <link rel="stylesheet" type="text/css" href="${assetUrl}"/>
    </head>
    <body>
        <h1>Welcome to the Headless Movie Database</h1>
        Open the links below in a new browser to access the GraphQL API:

        <h3>Drafts API:</h3>
        ${draftApi}
        <h3>Live API:</h3>
        ${masterApi}<br/>
        (Only available when the site has been published)
    </body>
  </html>
  `
    }
  };