const express = require('express');
const fs = require('fs');
const request = require('request');
const { Console } = require('console');
const bodyParser = require('body-parser');
const {GoogleSpreadsheet} = require('google-spreadsheet');

const api = "";  //replace with WCFP api code
const sheetStart = "https://sheets.googleapis.com/v4/spreadsheets/";
const sheetMiddle = "/values/";
const sheetEnd = "?alt=json&key="+ api;
const databaseCreds = require('');  //replace with WCFP service email auth json file

//Sheet names
const databaseID = "";
const sheetClientName = "Clients";
const sheetReferralName = "Referrals";
const sheetParcelName = "Parcels";
const sheetLocationName = "Locations";
const sheetUserName = "Users";

//sheetStart + SHEET ID + sheetMiddle + SHEET NAME + sheetEnd
const spreadsheet1 = sheetStart + databaseID + sheetMiddle + sheetClientName + sheetEnd;
const spreadsheet2 = sheetStart + databaseID + sheetMiddle + sheetReferralName + sheetEnd;
const spreadsheet3 = sheetStart + databaseID + sheetMiddle + sheetParcelName + sheetEnd;
const spreadsheet4 = sheetStart + databaseID + sheetMiddle + sheetLocationName + sheetEnd;
const spreadsheet5 = sheetStart + databaseID + sheetMiddle + sheetUserName + sheetEnd;

//setup spreadsheet for insert
const spreedsheetAdd = new GoogleSpreadsheet(databaseID);

//Server variables setup + urlencoder to read page data
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const app = express();
const port = 3000;

let clientSheet;
let referralSheet;
let parcelsSheet;
let locationSheet;
let userSheet;
let searchedForEntries;
let viewingEntries;

let clientIDStart = 0;
let referralIDStart = 0;
let parcelIDStart = 0;
let locationIDStart = 0;
let UserIDStart = 0;

class SearchError extends Error{
    constructor(message = ""){
        super(message);
        this.message = message;
    }
}

SearchError.prototype = Error.prototype;

async function loadDatabaseForInsert(){
    //authorise database connection and load database info into spreadsheetAdd variable
    await spreedsheetAdd.useServiceAccountAuth(databaseCreds);
    await spreedsheetAdd.loadInfo();
};

function requestDatabaseClient(func){
    request(spreadsheet1, function(err, response, body){
        clientSheet = JSON.parse(body).values;
        clientIDStart = parseInt(clientSheet[clientSheet.length-1][0]) +1;
        if(!(clientIDStart>=0)){
            clientIDStart = 0;
        }
        func();
    });
}
function requestDatabaseReferrals(func){
    request(spreadsheet2, function(err, response, body){
        referralSheet = JSON.parse(body).values;
        referralIDStart = parseInt(referralSheet[referralSheet.length-1][0]) +1;
        if(!(referralIDStart>=0)){
            referralIDStart = 0;
        }
        func();
    });
}
function requestDatabaseParcels(func){
    request(spreadsheet3, function(err, response, body){
        parcelsSheet = JSON.parse(body).values;
        parcelIDStart = parseInt(parcelsSheet[parcelsSheet.length-1][0]) +1;
        if(!(parcelIDStart>=0)){
            parcelIDStart = 0;
        }
        func();
    });
}
function requestDatabaseLocations(func){
    request(spreadsheet4, function(err, response, body){
        locationSheet = JSON.parse(body).values;
        locationIDStart = parseInt(locationSheet[locationSheet.length-1][0]) +1;
        if(!(locationIDStart>=0)){
            locationIDStart = 0;
        }
        func();
    });
}
function requestDatabaseUsers(func){
    request(spreadsheet5, function(err, response, body){
        userSheet = JSON.parse(body).values;
        UserIDStart = parseInt(userSheet[userSheet.length-1][0]) +1;
        if(!(UserIDStart>=0)){
            UserIDStart = 0;
        }
        func();
    });
}

function getColumnIndex(database, columnName){
    //columnName must be input as an array even for one item

    let searchIndex = new Array(columnName.length).fill(-1); //save the index the column name is under

    //Checks and saves the index for the column names in the database, or returns error if column name doesn't exist
    for(let columnIndex = 0; columnIndex < columnName.length; columnIndex++){
        for(let i = 0; i < database[0].length; i++){
            if(database[0][i] == columnName[columnIndex]){
                searchIndex[columnIndex] = i;
            }
        }
        if(!(searchIndex[columnIndex] >= 0)){
            throw new SearchError("Column name "+ columnName[columnIndex]+ " doesn't exist");
        }
    }
    return searchIndex;
}

function searchDatabase(database, columnName, searchTerm, andToggle, notToggle){

    let searchIndex = getColumnIndex(database, columnName);
    let foundEntries = new Array();     //holds entries with first column correct
    let confirmedEntries = new Array(); //final array of entries to be returned
    let duplicateIndex = new Array(); //holds OR indexes to prevent duplicate confirmed entires

    //Search entires columns that have the correct search term, all terms must be correct
    if(andToggle){
        for(let i = 1; i < database.length; i++){
            if(!notToggle){
                if(database[i][searchIndex[0]] == searchTerm[0]){
                    foundEntries.push(database[i]);
                }
            }else{
                if(database[i][searchIndex[0]] != searchTerm[0]){
                    foundEntries.push(database[i]);
                }
            }
        }
        
        if(searchTerm.length > 1){
            for(let i = 0; i < foundEntries.length; i++){
                let correctTerms = 0;
                for(let j = 1; j < searchTerm.length; j++){
                    if(!notToggle){
                        if(foundEntries[i][searchIndex[j]] == searchTerm[j]){
                            correctTerms++;
                        }
                    }else{
                        if(foundEntries[i][searchIndex[j]] != searchTerm[j]){
                            correctTerms++;
                        }
                    }
                }

                //if this entry has the correct number of searched terms it is added to the final array, if not move on to next iteration
                if(correctTerms == searchTerm.length - 1){
                    confirmedEntries.push(foundEntries[i]);
                }
            }
        }else{
            //if only one term is being searched for found entries do not need checking
            confirmedEntries = foundEntries;
        }
    }
    
    //Search entires columns that have the correct search term, any term can be correct
    else{
        for(let j = 0; j < searchTerm.length; j++){
            for(let i = 1; i < database.length; i++){
                if(!(duplicateIndex.includes(i))){
                    if(database[i][searchIndex[j]] == searchTerm[j]){
                        confirmedEntries.push(database[i]);
                        duplicateIndex.push(i); //allows check to prevent multi column search adding duplicate confirmed results
                    }
                }
            }
        }
    }
    
    
    //console.log(confirmedEntries);
    return confirmedEntries; //end of function
}

function joinDatabase(database, columnName){
    //database para must be input as an array of two databases - columnName must be an array of one value

    let confimedDatabase = new Array(); //holds joined database
    let searchIndexOne = getColumnIndex(database[0], columnName); //gets column index from database 1
    let searchIndexTwo = getColumnIndex(database[1], columnName); //gets column index for database joining with 1

    for(let i = 0; i < database[0].length; i++){
        for(let j = 0; j < database[1].length; j++){

            //database["databases to join"]["database entry"]["database column"]
            if(database[0][i][searchIndexOne[0]] == database[1][j][searchIndexTwo[0]]){
                //database[1][j].splice(searchIndexTwo[0],1); //remove duplicate column values
                confimedDatabase.push(database[0][i].concat(database[1][j])); //combine both entries and push into a single array
            }
        }
    }

    //console.log(confimedDatabase);
    return confimedDatabase;
}

function trimDatabase(database, columnName){
    let columnToKeep = getColumnIndex(database, columnName);
    let trimmedSet = new Array();
    for(let i = 0; i < database.length; i++){
        let concatRow = new Array();
        for(let j = 0; j < columnToKeep.length; j++){
            concatRow.push(database[i][columnToKeep[j]]);
        }
        trimmedSet.push(concatRow);
    }
    return trimmedSet;
}

function insertDatabase(databaseIndex, insertTerms){
    //insert terms into database according to which index it belongs to

    let sheetToInsert = spreedsheetAdd.sheetsByIndex[databaseIndex];    //load sheet with index of spreadsheet to append

    //insert data in the correct format according the specific spreadsheet headers
    if(databaseIndex == 0){
        sheetToInsert.addRow({ClientID: insertTerms[0], firstName: insertTerms[1], lastName: insertTerms[2], Address: insertTerms[3], Postcode: insertTerms[4], Phone: insertTerms[5], Email: insertTerms[6], Gender: insertTerms[7], Aggressive: insertTerms[8], ReasonForSupport: insertTerms[9], Expenditure: insertTerms[10], WeeksOfSupport: insertTerms[11], HousingStatus: insertTerms[12]});
    }else if(databaseIndex == 1){
        sheetToInsert.addRow({ReferralID: insertTerms[0], ClientID: insertTerms[1], ReferralSource: insertTerms[2], RefName: insertTerms[3], Email: insertTerms[4], Telephone: insertTerms[5], DateCreated: insertTerms[6], LastModified: insertTerms[7]});
    }else if(databaseIndex == 2){
        sheetToInsert.addRow({ParcelID: insertTerms[0], ReferralID: insertTerms[1], DateDistributed: insertTerms[2], ZeroToTwo: insertTerms[3], ThreeToTen: insertTerms[4], ElevenToSeventeen: insertTerms[5], EighteenToTwentyFive: insertTerms[6], TwentySixToFifty: insertTerms[7], FiftyOneToSixtyNine: insertTerms[8], SeventyAndOver: insertTerms[9], Total: insertTerms[10], LocationID: insertTerms[11], DateCreated: insertTerms[12], TotalParcels: insertTerms[13]});
    }else if(databaseIndex == 3){
        sheetToInsert.addRow({LocationID: insertTerms[0], Name: insertTerms[1], Address: insertTerms[2], Phone: insertTerms[3], Email: insertTerms[4], DateCreated:insertTerms[5], LastModified:insertTerms[6]});
    }else if(databaseIndex == 4){
        sheetToInsert.addRow({UserID: insertTerms[0], Username: insertTerms[1], Password: insertTerms[2], Role: insertTerms[3], DateCreated: insertTerms[4], LastModified: insertTerms[5]});
    }
}

app.get('/', (req, res) => {
    res.sendFile('/static/WCFP_web2/loginpage.html', {root: __dirname });
});
app.get('/orglogin', (req, res) => {
    res.sendFile('/static/WCFP_web2/loginpage.html', {root: __dirname });
});
app.get('/2faauthpage', (req, res) => {
    res.sendFile('/static/WCFP_web2/authpage.html', {root: __dirname });
});
app.get('/mainpage', (req, res) => {
    res.sendFile('/static/WCFP_web2/indexpage.html', {root: __dirname });
});
app.get('/refform', (req, res)=>{
    res.sendFile('/static/WCFP_web2/ref_form1.html', {root: __dirname });
});
app.get('/viewentry', (req, res)=>{
    res.sendFile('/static/WCFP_web2/viewreferralspage.html', {root: __dirname });
});
app.get('/clientdatabase', (req, res) => {
    requestDatabaseClient(() => {
        requestDatabaseReferrals(() => {
            requestDatabaseParcels(() => {
                let clientAndReferral = joinDatabase([clientSheet, referralSheet], ["ClientID"]);
                let crAndParcel = joinDatabase([clientAndReferral, parcelsSheet], ["ReferralID"]);
                let sampleDatabase = trimDatabase(crAndParcel, ["ClientID", "firstName", "lastName", "HousingStatus", "TotalParcels","DateDistributed", "ReasonForSupport","Total", "RefName", "Aggressive"]);
                console.log(clientAndReferral);
                console.log(crAndParcel);
                console.log(sampleDatabase);
                res.send(sampleDatabase);
            });
        });
    });
});
app.get('/showtablevar', (req, res)=>{
    res.send(viewingEntries);
})
app.get('/clienttablelength', (req, res)=>{
    requestDatabaseClient(()=>{
        res.send([clientSheet.length-1]);
    });
});
app.post('/add_entry', urlencodedParser, (req, res)=>{

    let data = req.body;

    requestDatabaseClient(()=>{
        let supportType = data.support;
        let expendOption = data.expendoption;
        let houseOption;

        if(supportType == "1"){
            supportType = "Bereavement";
        }else if(supportType == "2"){
            supportType = "Family Changes";
        }else if(supportType == "3"){
            supportType = "Sickness";
        }else if(supportType == "4"){
            supportType = "Fleeing Domestic Violence";
        }else if(supportType == "5"){
            supportType = "School Holidays";
        }else if(supportType == "6"){
            supportType = "Debt";
        }else if(supportType == "7"){
            supportType = "Loan Shark";
        }else if(supportType == "8"){
            supportType = "Working fewer hours";
        }else if(supportType == "9"){
            supportType = "Delay in Wages";
        }else if(supportType == "10"){
            supportType = "Unemployed and no benefit yet";
        }else if(supportType == "11"){
            supportType = "Delay in benefit";
        }else if(supportType == "12"){
            supportType = "Change in benefit";
        }else if(supportType == "13"){
            supportType = "Sanctioned benfit";
        }else if(supportType == "14"){
            supportType = "Refugee/ Asylum seeker";
        }else if(supportType == "15"){
            supportType = "Not able to meet increased cost of living";
        }else if(supportType == "16"){
            supportType = data.supportother;
        }else{
            supportType = "N/a";
        }

        if(expendOption == "2"){
            expendOption = data.expenditure;
        }else{
            expendOption = "N/a";
        }

        if(data.house1 != undefined){
            houseOption = "Housing Association Tenant";
        }else if(data.house2 != undefined){
            houseOption = "Private Tenant";
        }else if(data.house3 != undefined){
            houseOption = "Owner/Occupier";
        }else if(data.house4 != undefined){
            houseOption = "Homeless";
        }else if(data.house5 != undefined){
            houseOption = "Living with Sponser";
        }else if(data.house6 != undefined){
            houseOption = "Living with Friends/Family";
        }else{
            houseOption = "N/a";
        }

        let termsToInsertClient = [clientIDStart, data.fname, data.lname, data.addy, data.pcode, data.phone, data.pemail,data.gender,false, supportType, expendOption, data.weeks, houseOption];
        console.log(termsToInsertClient);
        insertDatabase(0, termsToInsertClient);

        requestDatabaseReferrals(()=>{
            let termsToInsertReferral = [referralIDStart, termsToInsertClient[0], data.org, data.fullname, data.email, data.refphone, data.date, data.date];
            console.log(termsToInsertReferral);
            insertDatabase(1, termsToInsertReferral);

            requestDatabaseParcels(()=>{

                let termsToInsertParcels = [parcelIDStart, termsToInsertReferral[0], '', data.qty[4], data.qty[5], data.qty[6], data.qty[0], data.qty[1], data.qty[2], data.qty[3], data.total, 0, data.date, 0];
                console.log(termsToInsertParcels);
                insertDatabase(2, termsToInsertParcels);
                return;

            });

            return;

        });

        return;

    });
    res.sendFile('/static/WCFP_web2/confirmentry.html', {root: __dirname });
});
app.post('/checklogin', urlencodedParser, (req, res)=>{
    let data = req.body;
    console.log(data);
    let username = data.uname;
    let password = data.psw;
    requestDatabaseUsers(()=>{
        let userSearch = searchDatabase(userSheet, ["Username", "Password"], [username, password], true, false);
        console.log(userSearch.length);
        if(userSearch.length > 0){
            res.sendFile('/static/WCFP_web2/successfullogin.html', {root: __dirname });
        }else{
            res.sendFile('/static/WCFP_web2/unsuccessfullogin.html', {root: __dirname });
        }
    });
});
app.post('/showtable', urlencodedParser, (req, res)=>{
    let data = req.body;
    requestDatabaseClient(()=>{
        requestDatabaseReferrals(()=>{
            requestDatabaseParcels(()=>{
                requestDatabaseLocations(()=>{
                    let databaseToJoin = new Array();
                    if(data.client == "on" && data.referral == "on" && data.location == "on" && data.parcel == "on"){
                        viewingEntries = joinDatabase([clientSheet, referralSheet], ["ClientID"]);
                        viewingEntries = joinDatabase([viewingEntries, parcelsSheet], ["ReferralID"]);
                        viewingEntries = joinDatabase([viewingEntries, locationSheet], ["LocationID"]);
                    }else if(data.client == "on" && data.referral == "on" && data.parcel == "on"){
                        viewingEntries = joinDatabase([clientSheet, referralSheet], ["ClientID"]);
                        viewingEntries = joinDatabase([viewingEntries, parcelsSheet], ["ReferralID"]);
                    }
                    else if(data.client == "on" && data.referral == "on"){
                        viewingEntries = joinDatabase([clientSheet, referralSheet], ["ClientID"]);
                    }
                    else if(data.referral == "on" && data.parcel == "on"){
                        viewingEntries = joinDatabase([referralSheet, parcelsSheet], ["ReferralID"]);
                    }
                    else if(data.parcel == "on" && data.location == "on"){
                        viewingEntries = joinDatabase([parcelsSheet, locationSheet], ["LocationID"]);
                    }else if(data.client == "on"){
                        viewingEntries = clientSheet;
                    }else if(data.referral == "on"){
                        viewingEntries = referralSheet;
                    }else if(data.parcel == "on"){
                        viewingEntries = parcelsSheet;
                    }else if(data.location == "on"){
                        viewingEntries = locationSheet
                    }
                    
                    res.sendFile('/static/WCFP_web2/showtable.html', {root: __dirname });
                });
            });
        });
    });
});

/*app.get('/clientsearch', (req, res)=>{
    res.sendFile('/static/html/clientsearch.html', {root: __dirname });
});

app.get('/searchedentry', (req, res) => {
    res.send(searchedForEntries);
});

app.post('/search_for_client', urlencodedParser,(req, res) => {
    let inputSearchTerms = new Array();
    let inputSearchEntries = new Array();

    let data = req.body;
    if(data.showAll == 'on'){
        searchedForEntries = clientSheet;
    }else{
        if(data.clientID != ''){
            inputSearchTerms.push("ClientID");
            inputSearchEntries.push(data.clientID);
        }if(data.firstName != ''){
            inputSearchTerms.push('firstName');
            inputSearchEntries.push(data.firstName);
        }if(data.lastName != ''){
            inputSearchTerms.push('lastName');
            inputSearchEntries.push(data.lastName);
        }if(data.address != ''){
            inputSearchTerms.push('Address');
            inputSearchEntries.push(data.address);
        }if(data.postcode != ''){
            inputSearchTerms.push('Postcode');
            inputSearchEntries.push(data.postcode);
        }if(data.phone != ''){
            inputSearchTerms.push('Phone');
            inputSearchEntries.push(data.phone);
        }if(data.email != ''){
            inputSearchTerms.push('Email');
            inputSearchEntries.push(data.email);
        }if(data.gender != ''){
            inputSearchTerms.push('Gender');
            inputSearchEntries.push(data.gender);
        }if(data.aggressiveyes == 'on'){
            inputSearchTerms.push('Aggressive');
            inputSearchEntries.push("TRUE");
        }if(data.aggressiveno == 'on'){
            inputSearchTerms.push('Aggressive');
            inputSearchEntries.push("FALSE");
        }
        
        searchedForEntries = searchDatabase(clientSheet, inputSearchTerms, inputSearchEntries, true, false);
        searchedForEntries.unshift(clientSheet[0]);
    }
    
    res.sendFile('/static/html/clientshow.html', {root: __dirname });
});*/


loadDatabaseForInsert();

console.log("Loading...");
app.listen(port);
console.log("Listening on port: "+port);
app.use(express.static(__dirname));