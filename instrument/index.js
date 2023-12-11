'use strict';

/*
The following Javascript assumes that the questions in qualtrics
have been set up as described in the README:
- set needed embedded data
- recode question choice values

The javascript must be inserted into the Qualtrics Questions JS.
However, in order to make this easier to copy, test, track, use
outside of qualtrics we make this a small javascript file here.
There are some strange choices made to accomodate for Qualtrics.

Basic steps:

Retrieve embedded data:
- API_TOKEN
- SurveyID
- ResponseID
- FQID (question id for file upload question)

Upon share (if in qualtrics and if consent):
- POST *new* survey response via Qualtrics API with just the file containing fingerprint data as the content.
- The new survey response is linked to the current survey response: the filename is this respondent's responseId

Note additional quirks: 
- sometimes the Qualtrics API prefers being called via 'this'. Sometimes via 'Qualtrics.SurveyEngine'.
- Qualtrics JS parser cannot handle: 'async' or smartquotes

*/

let qualtricsDeclared;
let surveyEngine;
try {
    Qualtrics;
    qualtricsDeclared = true;
    surveyEngine = this;
} catch(e) {
    qualtricsDeclared = false;
}
console.log(qualtricsDeclared ? 'Qualtrics' : 'Test without Qualtrics');

function getUrlParams(url) {
    if(!url) url = location.search;
    let query = url.substr(1);
    let result = {};
    query.split('&').forEach(function(part) {
        let item = part.split('=');
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}

// Note: Qualtrics makes the embedded data available via the 
// Qualtrics.SurveyEngine.getEmbeddedData
// EXCEPT for ResponseID. Must get this via the piped text feature.
function getResponseId() {
    return (!qualtricsDeclared) ? 'TEST_ResponseID' : '${e://Field/ResponseID}'; //Qualtrics.SurveyEngine.getEmbeddedData('ResponseID');
}
function getSurveyId() {
    return (!qualtricsDeclared) ? 'TEST_SurveyID' : Qualtrics.SurveyEngine.getEmbeddedData('SurveyID');
}
function getApiToken() {
    return (!qualtricsDeclared) ? 'TEST_API_TOKEN' : Qualtrics.SurveyEngine.getEmbeddedData('API_TOKEN');
}
function getFQID() {
    return (!qualtricsDeclared) ? 'TEST_FQID' : Qualtrics.SurveyEngine.getEmbeddedData('FQID');
}
const responseId = getResponseId();
const surveyId = getSurveyId();
const API_TOKEN = getApiToken();
const FQID = getFQID();
const DATACENTERID = 'iad1';
// Note string interpolation with ` and $ not supported in qualtrics JS.
const BASE_URL = 'https://' + DATACENTERID + '.qualtrics.com/API';
console.log('using responseId:', responseId, 'surveyId:', surveyId, 'FQID:', FQID, 'BASE_URL:', BASE_URL);

function getEmbeddedShowData() {
    // Returns Boolean or undefined
    if (!!qualtricsDeclared) {
        let embeddedShowData = Qualtrics.SurveyEngine.getEmbeddedData('showdata');
        if (embeddedShowData === 'true' || embeddedShowData === true) {
            return true;
        } else if (embeddedShowData === 'false' || embeddedShowData === false) {
            return false;
        }
    }
}
// Embedded data value can be overridden by URL parameters.
let showDataDefault = true; // default
function getShowData() {
    let showData = getEmbeddedShowData();
    // URL parameter (can override embedded data)
    let urlParamShowData = getUrlParams()['showdata'];
    if (urlParamShowData==='false') {
        showData = false;
    } else if (urlParamShowData==='true') {
        showData = true;
    }
    return (showData===undefined) ? showDataDefault : showData;
}
const showData = getShowData();
console.log('showdata=', showData);

let isDebugDefault = !qualtricsDeclared; // default: true when not using qualtrics, false using qualtrics
function getIsDebug() {
    let isDebug = isDebugDefault;
    let urlParamIsDebug = getUrlParams()['isDebug'];
    if (urlParamIsDebug==='false') {
        isDebug = false;
    } else if (urlParamIsDebug==='true') {
        isDebug = true;
    }
    return isDebug;
}
const isDebug = getIsDebug();
console.log('isDebug=', isDebug);


/*
make a map: attribute name (human readable): attribute value

map the human readable attribute names that we want to store to a function to get them
- create a function to get each attribute
- when the attribute is unavailable: log an error and leave empty
- JSON.stringify values

put the map in a csv with columns: attribute, value
if debug: download the csv

put the map in a table
if showData: show the table; otherwise it is invisible

make a fingerprint with all the values; log it
if debug: show fingerprint

*/

let attributes = [
    'User agent',
    'Languages',
    'Fonts',            // list
    'Plugins',          // list
    'Local storage',    // true/false: Use of local storage
    'Timezone',
    'Screen resolution',
    'Color depth',
    'Platform',
    'Canvas',
    'WebGL Vendor',
    'WebGL Renderer',
    'Cookies enabled',  // true/false
];

const attributeGetters = {
    'User agent': getUserAgent,
    'Languages': function() { return getFingerprintJsComponentList('languages', 2); },
    'Fonts': function() { return getFingerprintJsComponentList('fonts', 2); },
    'Plugins': getPlugins,
    'Local storage': function() { return getFingerprintJsComponentValue('localStorage'); },
    'Timezone': function() { return fingerprintJsComponents['timezone'].value; },
    'Screen resolution': function() { return getFingerprintJsComponentList('screenResolution', 2); },
    'Color depth': function() { return fingerprintJsComponents['colorDepth'].value; },
    'Platform': function() { return fingerprintJsComponents['platform'].value; },
    'Canvas': getCanvas,
    'WebGL Vendor': function() { return fingerprintJsComponents['webGlBasics'].value.vendor; },
    'WebGL Renderer': function() { return fingerprintJsComponents['webGlBasics'].value.renderer; },
    'Cookies enabled': function() { return fingerprintJsComponents['cookiesEnabled'].value; },
};

let csvFile = null;
let attributeToValueMap = {};
let fingerprint = null;
// many functions that get attributes utilize fingerprintjs
let fingerprintJsComponents = null;

function getAttributes() {
    for (var attributeName in attributeGetters) {
        attributeToValueMap[attributeName] = attributeGetters[attributeName]();
    }
    return attributeToValueMap;
}

function getUserAgent() {
    return window.navigator.userAgent;
}

function getPlugins() {
    // plugins: {name: 'name', description: 'description', 'mimeTypes': list}
    let plugins = fingerprintJsComponents['plugins'].value;
    return JSON.stringify(plugins.map(plugin => plugin.name));
}

function getCanvas() {
    return fingerprintJsComponents['canvas'].value.text;
}

function getFingerprintJsComponentValue(component) {
    return JSON.stringify(fingerprintJsComponents[component].value);
}

function getFingerprintJsComponentList(component, depth) {
    return JSON.stringify(fingerprintJsComponents[component].value.flat(depth));
}

function getFingerprint(attributesToValues) {
    // Returns a promise
    let canonicalString = attributesToCanonicalString(attributesToValues);
    const utf8 = new TextEncoder().encode(canonicalString);
    return crypto.subtle.digest('SHA-256', utf8).then(function(hashBuffer) {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((bytes) => bytes.toString(16).padStart(2, '0'))
        .join('');
      return hashHex;
    });
}

function attributesToCanonicalString(attributesToValues) {
    let result = '';
    for (const attributeName of Object.keys(attributesToValues).sort()) {
        let value = attributesToValues[attributeName];
        if (typeof value != 'string') {
            value = JSON.stringify(value);
        }
        
        result += (result.length > 0) ? ('|' + value) : value;
    }
    return result;
}

function buildCsvFile(attributesToValues) {
    // transform to csv type with list of rows [attribute, value]
    let csvData = [];
    for (var attributeName in attributesToValues) {
        csvData.push([attributeName, attributesToValues[attributeName]]);
    }
    let csv = Papa.unparse({'fields':['Attribute','Value'], 'data':csvData});
    if (isDebug) {
        // set up the test share button so that click downloads the csv
        let a = document.getElementById('download-csv');
        a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
        a.setAttribute('download', 'attributes-values.csv');
    }
    csvFile = new Blob([csv], {type:'text/csv'});
    return csvFile
}

let dataContainerElt = document.getElementById('data-container');
dataContainerElt.style.display = 'none';
function buildTable(attributesToValues) {
    // In case the respondent previously inserted a file that passed validation:
    // Clear out (possibly) previously inserted data.
    dataContainerElt.innerHTML = '';
    let totalRows = Object.keys(attributesToValues).length;
    let totalRowsP = document.getElementById('rows-count');
    totalRowsP.appendChild(document.createTextNode(totalRows.toString() + ' rows (scroll)'));
    
    let tableElt = document.createElement('table');
    var tableBodyElt = document.createElement('tbody');
    // create header
    let headerRowElt = document.createElement('tr');
    ['Attribute', 'Value'].forEach(col => {
        let cell = document.createElement('th');
        cell.appendChild(document.createTextNode(col));
        headerRowElt.appendChild(cell);
    });
    tableBodyElt.appendChild(headerRowElt);
    // create table rows
    for (var attributeName in attributesToValues) {
        let value = attributesToValues[attributeName];
        let rowElt = document.createElement('tr');
        [attributeName, value].forEach(c => {
            let cell = document.createElement('td');
            cell.appendChild(document.createTextNode(c));
            rowElt.appendChild(cell);
        });
        tableBodyElt.appendChild(rowElt)
    };
    tableElt.appendChild(tableBodyElt);
    dataContainerElt.appendChild(tableElt);
    if (showData) {
        dataContainerElt.style.display = 'block';
    }
}

function uploadCsvData() {
    let surveyId = getSurveyId();
    let responseId = getResponseId();
    createSurveyResponseForFile(surveyId, responseId, csvFile, FQID)
    .then(function(result) {
        console.log('Created survey response for file. Returned result', result);
    });
}

// Note Qualtrics JS parser doesn't allow 'async'
function createSurveyResponseForFile(surveyId, responseId, f, fQID) {
    /*
    Note: This is a messy hack to integrate the Qualtrics questions API with the 
    other Qualtrics API in order to upload files from the survey for the respondent.
    Creates a new survey response for the file uploaded by the respondant with
    responseId.
    This is a *separate* response where the only response value is the file.
    The fileQID is the QID for an invisible file upload field.
    We use the responseId for the current survey taker as both the 
    upload file name and idempotency-key (upload it once)

    Uses the create new survey response API endpoint:
    https://api.qualtrics.com/f1cad92018d2b-create-a-new-response
    */
    let fname = String(responseId) + '.csv'; // Qualtrics: avoid using smart quotes
    let formData = new FormData();
    formData.append('response', JSON.stringify({values:{}})); // required
    formData.append('fileMapping', JSON.stringify({file1: fQID}));
    formData.append('file1', f, fname); // use the respondId as the upload filename
    const url = BASE_URL + '/v3/surveys/' + String(surveyId) + '/responses';
    console.log('Created survey response for file with POST to URL:', url);
    return fetch(url, {
        method: 'POST',
        headers: {
            // Despite the API documentation: leave 'Content-Type' undefined/empty
            // and let browser determine content-type header value
            // The reason is that a 'boundary' value must be inserted and the browser can best do this.
            // 'Content-Type': undefined, //'multipart/form-data', 
            // Using Idempotency-Key to ensure only one file upload per responseId
            // Must use No value or different idempotency-key to create new responses!
            'Idempotency-Key': responseId, 
            'X-API-TOKEN': API_TOKEN,
        },
        body: formData
    }) // yes using arrows would be nice, but not supported by qualtrics JS parser
    .then(function(response) { return response.json() })
    .then(function(result) { console.log('result:', result); return result.result; })
    .catch(function(err) { console.log('error:', err); return err; } );
}

function main() {
    // call fingerprintjs which returns a promise
    let fpPromise = FingerprintJS.load()
    .then(function(fp) { return fp.get() })
    .then(function(result) { 
        fingerprintJsComponents = result.components;
        return result.components; 
    })
    .then(function(fingerprintComponents) { return getAttributes(fingerprintComponents) })
    .then(function(attributesToValues) {
        attributeToValueMap = attributesToValues;
        csvFile = buildCsvFile(attributesToValues);
        getFingerprint(attributesToValues).then(function(fp) {
            fingerprint = fp;
            console.log('Fingerprint:\n'+fingerprint);
            if (isDebug) {
                // show fingerprint
                document.getElementById('fingerprint').innerHTML = fingerprint;
            }
        });
        // build the table
        buildTable(attributesToValues);
        checkEnableNext();
    });
}

let choiceContainerSelector = qualtricsDeclared ? '.QuestionBody' : '.test-choice-container'; // using class for testing to be consistent with qualtrics
let showChoices = function() {
    document.querySelectorAll(choiceContainerSelector).forEach(function(el) {
        el.style.display = 'block';
    });
}
let hideChoices = function() {
    document.querySelectorAll(choiceContainerSelector).forEach(function(el) {
        el.style.display = 'none';
    });
}
let disableNext = function() {
    if (!qualtricsDeclared) {
        return console.log('disableNext');
    }
    surveyEngine.disableNextButton();
}
let enableNext = function() {
    if (!qualtricsDeclared) {
        return console.log('enableNext');
    }
    surveyEngine.enableNextButton();
}
function checkEnableNext() {
    if (!!choiceSelected) {
        enableNext();
    }
}

let choiceSelected = false;
main();
showChoices();
disableNext();

if (qualtricsDeclared) {
    let uploadConsent = false;
    surveyEngine.questionclick = function(event, element){
        console.log('surveyEngine.questionclick', event, element)
        // for a single answer multiple choice question, the element type will be radio
        // the consent/decline questions are consistently recoded (TODO: ensure this)
        // consent: value=1; decline:value=0
        if (element.type == 'radio') {
            let choiceId = element.id.split('~')[2];
            let choiceRecodeValue = surveyEngine.getChoiceRecodeValue(choiceId);
            if (choiceRecodeValue === '1') {
                uploadConsent = true;
            } else {
                uploadConsent = false;
            }
            choiceSelected = true;
            console.log('set upload consent to ', uploadConsent);
            checkEnableNext();
        }
    }
    Qualtrics.SurveyEngine.addOnPageSubmit(function(type) {
        console.log('OnPageSubmit with type', type);
        if (type !== 'prev') {
            if (uploadConsent == true) {
                uploadCsvData();
            }
        }
    });
    console.log('Qualtrics script bottom')
}
console.log('script bottom');