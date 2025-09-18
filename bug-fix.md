Go into planning mode. 

I'm seeing the following issue on the server when I try to copy a new weekly schedule from a schedule template:

Error creating weekly schedule: TypeError: Cannot read properties of undefined (reading 'filter')
at model.<anonymous> (/Users/carterwilson/Repos/IronLogic3/server/src/models/ScheduleTemplate.ts:168:25)
at VirtualType.applyGetters (/Users/carterwilson/Repos/IronLogic3/node_modules/mongoose/lib/virtualType.js:152:16)
at applyVirtuals (/Users/carterwilson/Repos/IronLogic3/node_modules/mongoose/lib/document.js:4196:26)
at model.Document.$toObject (/Users/carterwilson/Repos/IronLogic3/node_modules/mongoose/lib/document.js:3926:5)
at model.Document.toJSON (/Users/carterwilson/Repos/IronLogic3/node_modules/mongoose/lib/document.js:4407:15)
at clone (/Users/carterwilson/Repos/IronLogic3/node_modules/mongoose/lib/helpers/clone.js:67:17)
at cloneObject (/Users/carterwilson/Repos/IronLogic3/node_modules/mongoose/lib/helpers/clone.js:159:17)
at clone (/Users/carterwilson/Repos/IronLogic3/node_modules/mongoose/lib/helpers/clone.js:80:16)
at model.Document.$toObject (/Users/carterwilson/Repos/IronLogic3/node_modules/mongoose/lib/document.js:3904:11)
at model.Document.toJSON (/Users/carterwilson/Repos/IronLogic3/node_modules/mongoose/lib/document.js:4407:15)
::ffff:127.0.0.1 - - [18/Sep/2025:16:43:45 +0000] "POST /api/weekly-schedules HTTP/1.1" 500 73 "http://localhost:3000/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"

Investigate and find the cause of this issue and create a plan to fix it.