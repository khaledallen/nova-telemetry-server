const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var mongoose = require('mongoose')

var ObjectID = mongodb.ObjectID;
var fetchUrl = require("fetch").fetchUrl;
const { GoogleSpreadsheet } = require('google-spreadsheet');

//const simulationRouter = require('./routes/evarouter')
//const uiaSimulationRouter = require('./routes/uiarouter')

var TELEM_STATES_COLLECTION = "telemetry-states";

var app = express();

//Database connector
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})

app.use(bodyParser.json());
app.use((req,res,next) =>{
	res.setHeader(
		'Access-Control-Allow-Origin', '*'
	)
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-Width, Content-Type, Accept'
	)
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PATCH, DELETE, OPTIONS'
	)
	next()
})


app.use(express.static(path.join(__dirname, 'public')))

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))
// Initialize the app.
var server = app.listen(process.env.PORT || 5000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db = mongoose.connection;
var telemetry = {};

// spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet('1GZJ5CM8FElwuoiOX1xoMh6s41G7QeMviRom769Jf6h0');

//app.use('/api/simulation', simulationRouter)
//app.use('/api/simulation/', uiaSimulationRouter)

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/api/simulation/state"
 *    GET: gets state of the EVA suti
 *    POST: create a new state
 */

app.get("/api/simulation/state", function(req, res) {
    //res.status(200).json(telemetry);
    res.status(200).send("Simulation state endpoint. Under construction.")
});
/*

*/

/*  "/api/utils/procedures"
 *    GET: gets all tasks
 *    POST: create a new state
 */

app.get("/api/utils/procedures", async function(req, res) {
    const TASK_SHEET = 0;
    const PROCEDURE_SHEET = 1;
    const STEP_SHEET = 2;
    const SUBSTEP_SHEET = 3;
    const TOOLS_SHEET = 4;
    let tasks = [];
    let procedures = [];
    let steps = [];
    let substeps = [];

    // spreadsheet key is the long id in the sheets URL
    const doc = new GoogleSpreadsheet('1GZJ5CM8FElwuoiOX1xoMh6s41G7QeMviRom769Jf6h0');

    // use service account creds
    try {
    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/gm, '\n')
    });
    }
    catch(err){
        console.log(err);
    }
    // OR load directly from json file if not in secure environment
    // await doc.useServiceAccountAuth(require('./CUTEE2020-1f510cc88145.json'));
    await doc.loadInfo(); // loads document properties and worksheets


    async function processSheet(sheetId, storageArray){
        let sheet = doc.sheetsByIndex[sheetId];
        let rows = await sheet.getRows();
        rows.forEach( row => {
            let newTodo = {};
            row._sheet.headerValues.forEach( prop => {
                newTodo[prop] = row[prop];
            });
            if(row.children) {
                newTodo.childIds = row.children.split(',').map( childId => Number(childId));
                newTodo.children = [];
            }
            storageArray.push(newTodo);
        })
    }
    await processSheet(TASK_SHEET, tasks);
    await processSheet(PROCEDURE_SHEET, procedures);
    await processSheet(STEP_SHEET, steps);
    await processSheet(SUBSTEP_SHEET, substeps);

    const sheets = [substeps, steps, procedures, tasks];

    for (let i = 0; i < sheets.length - 1; i++) {
        while(sheets[i].length > 0){
            let currentTodo = sheets[i].shift();
            let parent = sheets[i+1].find( p => p._id == currentTodo.parent )
            parent.children.push(currentTodo);
        }
    }

    responseObject = {
        tasks: tasks
    }
    //console.log(responseObject);
    //console.log(JSON.stringify(responseObject.tasks));

    res.status(200).json(responseObject);
});

