var portal = require('/lib/xp/portal');

exports.get = function (req) {
    var title = "Headless Movie Database";
    var heading = "Welcome to the Headless Movie Database";
    var preview = "Click \"Preview\" button in Content Studio access the API.";
    var assetUrl = portal.assetUrl({
        path: 'styles.css'
      });
    var siteUrl = portal.pageUrl({
        id: portal.getSite()._id
      });
    var apiUrl = siteUrl+"/_graphql";
    var baseUrl = req.scheme+"://"+req.host+":"+req.port;
    var sdkMode = (req.host === 'localhost' || req.host === '127.0.0.1') ? true : false;
    var draftPath = "/site/hmdb/draft/hmdb";
    var draftApi = baseUrl+draftPath+"/_graphql";
    var masterPath = "/site/hmdb/master/hmdb";
    var masterApi = baseUrl+masterPath+"/_graphql";
    var branch = req.branch;
    var mode = req.mode;
    var vhostDocs = "https://developer.enonic.com/docs/xp/stable/deployment/vhosts";

    var standard = `
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" type="text/css" href="${assetUrl}"/>
      </head>
      <body>
          <h1>${heading}</h1>
          <h3>You are now accessing the "${branch}" branch in "${mode}" mode</h3>   
          Visit the <a href="${apiUrl}">Headless GraphQL API</a> of this branch.
        </body>
    </html>
    `;
    
    var inline = `
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" type="text/css" href="${assetUrl}"/>
      </head>
      <body>
          <strong>${preview}</strong>
          <h1>${heading}</h1>
          <h3>Enonic Cloud Demo</h3>
          <p>If this application was installed as part of an Enonic Cloud demo, you may access the draft and live APIs on public URLs by visiting one of the solution's pre-defined routes.</p>
          <h3>Other deployments</h3>
          <p>For custom deployments, a vhost must be configured to reach this site and it's API publicly.
            The internal paths to use for vhosts mappings are:<br/><br/>
            Draft site: ${draftPath}<br/>
            Live site: ${masterPath}. <br/><br/>
            For more details on using vhosts, check out the <a target="_blank" href="${vhostDocs}">vhosts documentation</a>.
          </p>
        </body>
    </html>
    `;

    var sdk = `
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" type="text/css" href="${assetUrl}"/>
      </head>
      <body>
          <strong>${preview}</strong>
          <h1>${heading}</h1>
        
          <p>Use the following internal paths to expose the API to the public:</p>
  
          <h3>Drafts API:</h3>
          ${draftApi}
          
          <h3>Live API: (Publish site to access)</h3>
          ${masterApi}
     
          <h3>Pretty URLs</h3>
          When deploying to a server, use <a target="_blank" href="${vhostDocs}">vhosts</a> to create custom URLs like "example.com/_graphql".
      </body>
    </html>
    `;

    // For all previews
    if (req.mode == 'preview') {
      return {
        body: standard
      }
    }
    // running on localhost
    else if (sdkMode) {
      return  {
        body: sdk
      }
    }
    else {
      return {
        body: inline
      }
    }
    
  };