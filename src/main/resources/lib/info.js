var portal = require('/lib/xp/portal');
var contentLib = require('/lib/xp/content');

function pickImageId(content) {
    var refs = contentLib.getOutboundDependencies({key: content._id});
    if (!refs || refs.length === 0) {
        return null;
    }
    for (var i = 0; i < refs.length; i++) {
        var item = contentLib.get({key: refs[i]});
        if (item && item.type === 'media:image') {
            return item._id;
        }
    }
    return null;
}

exports.GET = function (req) {
    var title = "Headless Movie Database";
    var heading = "Welcome to the Headless Movie Database";
    var info = "Tip: This preview was created by the file: /src/main/resources/lib/info.js";
    var cssUrl = portal.assetUrl({
        path: 'styles.css'
      });
    var content = portal.getContent();
    var imageId = content ? pickImageId(content) : null;
    var bannerUrl = imageId ? portal.imageUrl({id: imageId, scale: 'width(500)'}) : null;
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
          ${bannerUrl ? `<img class="banner" src="${bannerUrl}"/>` : ''}
          <p>${info}</p>
        </body>
    </html>
    `;

    return {
      body: standard
    }

  };