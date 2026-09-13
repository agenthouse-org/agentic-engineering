// Replace with the team's own process. stdout contains only the JSON contract.
const pass=process.env.RELEASE_READY==='yes';
console.log(JSON.stringify({schemaVersion:1,status:pass?'passed':'failed',reason:pass?'Release readiness confirmed by configured check':'RELEASE_READY is not yes',findings:[]}));
