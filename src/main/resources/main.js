const contextLib = require('/lib/xp/context');
const clusterLib = require('/lib/xp/cluster');
const exportLib = require('/lib/xp/export');
const projectLib = require('/lib/xp/project');
const taskLib = require('/lib/xp/task');

const projectData = {
    id: 'hmdb',
    displayName: 'Headless Demo',
    description: 'Headless Movie DB sample content',
    language: 'en',
    readAccess: {
        public: true
    }
}

const runInContext = function(callback) {
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

const createProject = function() {
    return projectLib.create(projectData);
}

const getProject = function() {
    return projectLib.get({
        id: projectData.id
    });
}

const initialize = function () {
    runInContext(() => {
        const project = getProject();
        if (!project) {
            taskLib.executeFunction({
                description: 'Importing HMDB content',
                func: initProject
            });
        }
        else {
            log.debug(`Project ${project.id} exists, skipping import`);
        }
    });
};

const initProject = function() {
    // log.info('Project "' + projectData.id + '" not found. Creating...');
    const project = createProject();

    if (project) {
        log.info('Project "' + projectData.id + '" successfully created');
        createContent();
    }
    else {
        log.error('Project "' + projectData.id + '" failed to be created');
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
    log.info('-------------------');
    log.info('Imported nodes:');
    importNodes.addedNodes.forEach(element => log.info(element));
    log.info('-------------------');
    log.info('Updated nodes:');
    importNodes.updatedNodes.forEach(element => log.info(element));
    log.info('-------------------');
    log.info('Imported binaries:');
    importNodes.importedBinaries.forEach(element => log.info(element));
    log.info('-------------------');
    if (importNodes.importErrors.length !== 0) {
        log.warning('Errors:');
        importNodes.importErrors.forEach(element => log.warning(element.message));
        log.info('-------------------');
    }
}

if (clusterLib.isMaster()) {
    initialize();
}
