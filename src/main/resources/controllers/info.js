var portal = require('/lib/xp/portal');

exports.get = function (req) {
    var title = "Headless Movie Database";
    var heading = "Welcome to the Headless Movie Database";
    var info = "Tip: This preview was created by the file: /src/main/resources/controllers/info.js";
    var cssUrl = portal.assetUrl({
        path: 'styles.css'
      });
    var bannerUrl = portal.assetUrl({
        path: 'hmdb-banner.svg'
      });
    var branch = req.branch;
    var mode = req.mode;
   
    var standard = `
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" type="text/css" href="${cssUrl}"/>
      </head>
      <body>
          <h1>${heading}</h1>
          <h3>You are now accessing the "${branch}" branch in "${mode}" mode</h3>
          <img class="banner" src="${bannerUrl}"/>
          <p>${info}</p>
        </body>
    </html>
    `;
    
    return {
      body: standard
    }
    
  };