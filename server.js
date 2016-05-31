var connect = require('connect');                  
var serveStatic = require('serve-static');         
console.log("port 3000");
connect().use(serveStatic(__dirname)).listen(4000);
