const contextLib = require('/lib/xp/context');
const contentLib = require('/lib/xp/content');
const clusterLib = require('/lib/xp/cluster');
const exportLib = require('/lib/xp/export');
const projectLib = require('/lib/xp/project');
const taskLib = require('/lib/xp/task');

const projectData = {
    id: 'hmdb',
    displayName: 'Headless Movie DB',
    description: 'Site enabled version of the Movie DB',
    language: 'en',
    readAccess: {
        public: true
    }
}

const runInContext = function (callback) {
    let result;
    try {
        result = contextLib.run({
            principals: ["role:system.admin"],
            repository: 'com.enonic.cms.' + projectData.id
        }, callback);
    } catch (e) {
        log.info('Error: ' + e.message);
    }

    return result;
}

const createProject = function () {
    return projectLib.create(projectData);
}

const getProject = function () {
    return projectLib.get({
        id: projectData.id
    });
}

const initialize = function () {
    runInContext(() => {
        const project = getProject();
        if (!project) {
            taskLib.executeFunction({
                description: 'Importing content',
                func: initProject
            });
        }
        else {
            log.debug(`Project ${project.id} exists, skipping import`);
        }
    });
};

const initProject = function () {
    // log.info('Project "' + projectData.id + '" not found. Creating...');
    const project = createProject();

    if (project) {
        log.info('Project "' + projectData.id + '" successfully created');
        createContent();
        publishRoot();
    } else {
        log.error('Project "' + projectData.id + '" creation failed');
    }
};

function createContent() {
    let importNodes = exportLib.importNodes({
        source: resolve('/import'),
        targetNodePath: '/content',
        xslt: resolve('/import/replace_app.xsl'),
        xsltParams: {
            applicationId: app.name
        },
        includeNodeIds: true
    });
    if (importNodes.importErrors.length > 0) {
        log.warning('Errors:');
        importNodes.importErrors.forEach(element => log.warning(element.message));
        log.info('-------------------');
    }
}

function publishRoot() {
    const result = contentLib.publish({
        keys: ['/hmdb'],
        sourceBranch: 'draft',
        targetBranch: 'master',
    });
    if (!result) {
       log.warning('Could not publish imported content.');
    }
}

if (clusterLib.isMaster()) {
    initialize();
}
