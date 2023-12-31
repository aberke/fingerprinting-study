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

const attributeGetters = {
    'User agent': getUserAgent,
    'Languages': getLanguages,
    'Fonts': function() { return getFingerprintJsComponentList('fonts', 2); },
    'Plugins': getPlugins,
    'Local storage': function() { return getFingerprintJsComponentValue('localStorage'); },
    'Timezone': function() { return fingerprintJsComponents['timezone'].value; },
    'Screen resolution': function() { return getFingerprintJsComponentList('screenResolution', 2); },
    'Color depth': function() { return fingerprintJsComponents['colorDepth'].value; },
    'Platform': function() { return fingerprintJsComponents['platform'].value; },
    'Touch points': getTouchPoints,
    'Cookies enabled': function() { return fingerprintJsComponents['cookiesEnabled'].value; },
    //'Audio': function() { return fingerprintJsComponents['audio'].value; },
    'WebGL Vendor': function() { return webGLInfo.vendor },
    'WebGL Renderer': function() { return webGLInfo.renderer },
    'WebGL Unmasked Vendor': function() { return webGLInfo.vendorUnmasked },
    'WebGL Unmasked Renderer': function() { return webGLInfo.rendererUnmasked },
    'Hardware concurrency': getHardwareConcurrency,
    'Device memory': getDeviceMemory,
    'UA high entropy values': function() { return UADataHighEntropyValues; },
    // Some browsers making canvas fingerprinting too difficult
    // We collect it anyway and take extra care during analysis
    'Canvas text': getCanvasText,
    'Canvas geometry': getCanvasGeometry,
    // We collect an array of incremental creations based on the canonical test/what fingerprintjs does
    // We return only the hash values because otherwise the set of values is very large and we only
    // wish to study when they diverge.
    'Canvas text hashed': function () { return JSON.stringify(getCanvasTextHashValues()) },
    'Canvas geometry hashed': function () { return JSON.stringify(getCanvasGeometryHashValues()) },
};

let csvFile = null;
let attributeToValueMap = {};
let fingerprint = null;
// many functions that get attributes utilize fingerprintjs
let fingerprintJsComponents = null;

function getAttributes() {
    let a = {};
    for (var attributeName in attributeGetters) {
        a[attributeName] = attributeGetters[attributeName]();
    }
    return a;
}

function getDeviceMemory() {
    return navigator.deviceMemory || '';
}
function getHardwareConcurrency() {
    return navigator.hardwareConcurrency || '';
}

// Get WebGL information. Note that unmasked is more informative yet used less in prior work.
// https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info
// Note: Depending on the privacy settings of the browser, 
// this extension might only be available to privileged contexts or not work at all. 
// In Firefox, if privacy.resistFingerprinting is set to true, this extensions is disabled.
// This extension is available to both, WebGL1 and WebGL2 contexts.
function getWebGLInfo() {
    let webGLInfo = {
        vendor: '',
        vendorUnmasked: '',
        renderer: '',
        rendererUnmasked: ''
    };
    // set up the webGL context
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('cannot get WebGL info: !gl');
        return webGLInfo;
    }
    if (typeof gl.getParameter !== 'function') {
        console.log("cannot get WebGL info: typeof gl.getParameter !== 'function'");
        return webGLInfo;
    }
    let vendor = gl.getParameter(gl.VENDOR);
    let renderer = gl.getParameter(gl.RENDERER);
    webGLInfo.vendor = (!!vendor) ? vendor.toString() : '';
    webGLInfo.renderer = (!!renderer) ? renderer.toString() : '';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!!debugInfo) {
        const vendorUnmasked = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const rendererUnmasked = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        webGLInfo.vendorUnmasked = (!!vendorUnmasked) ? vendorUnmasked.toString() : '';
        webGLInfo.rendererUnmasked = (!!rendererUnmasked) ? rendererUnmasked.toString() : '';
    }
    return webGLInfo;
}
let webGLInfo = getWebGLInfo();

// Experimental feature
let UADataParameters = ['architecture', 'model', 'platform', 'platformVersion'];
let UADataHighEntropyValues = ''; // Default: no values
// Returns a promise
function getUADataHighEntropyValues() {
    try {
        if (!navigator.userAgentData) {
            console.log('!navigator.userAgentData; Returning empty promise.');
            return Promise.resolve();
        }
        return navigator.userAgentData.getHighEntropyValues(UADataParameters)
        .then((ua) => {
            UADataHighEntropyValues = JSON.stringify(ua);
            return UADataHighEntropyValues;
        });
    } catch (e) {
        console.log('Error getting UA high entropy values:', e);
        return Promise.resolve();
    }
}

function getUserAgent() {
    return window.navigator.userAgent;
}

function getLanguages() {
    return navigator.languages;
}

function getPlugins() {
    try {
        // plugins: {name: 'name', description: 'description', 'mimeTypes': list}
        let plugins = fingerprintJsComponents['plugins'].value;
        return JSON.stringify(plugins.map(plugin => plugin.name));
    } catch(e) {
        console.error('Error getting plugins: ', e);
        return;
    }
}

function getTouchPoints() {
    try {
        const touchSupport = fingerprintJsComponents['touchSupport'].value;
        if (!!fingerprintJsComponents['touchSupport'].value) {
            return fingerprintJsComponents['touchSupport'].value.maxTouchPoints;
        }
    } catch(e) {
        console.error('Error getting touch points:', e);
        return;
    }
}

function getCanvasGeometryHashValues() {
    // Returns a hash of the images.
    return getCanvasGeometryInSteps().map((u) => hashCode(u));
}
function getCanvasGeometry() {
    // Returns the last image.
    return getCanvasGeometryInSteps().pop() || '';
}
function getCanvasTextHashValues() {
    // Returns a hash of the images.
    return getCanvasTextInSteps().map((u) => hashCode(u));
}
function getCanvasText() {
    // Returns the last image.
    return getCanvasTextInSteps().pop() || '';
}

function getCanvasGeometryInSteps() {
    // Return a list of images representing steps to create a final image.
    try {
        const dataURLs = [];
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 120;
        canvas.height = 120;
        context.globalCompositeOperation = 'multiply';
        const drawParams = [['#f2f', 40, 40],['#2ff', 80, 40],['#ff2', 60, 80]];
        for (var i=0; i<drawParams.length; i++) {
            let color = drawParams[i][0];
            let x = drawParams[i][1];
            let y = drawParams[i][2];
            context.fillStyle = color;
            context.beginPath();
            context.arc(x, y, 40, 0, Math.PI * 2, true);
            context.closePath();
            context.fill();
            dataURLs.push(canvas.toDataURL());
        }
        context.fillStyle = '#f9c';
        context.arc(60, 60, 60, 0, Math.PI * 2, true);
        context.arc(60, 60, 20, 0, Math.PI * 2, true);
        context.fill('evenodd');
        dataURLs.push(canvas.toDataURL());
        return dataURLs;
    } catch (e) {
        console.log('Error getting canvas geometries:', e);
        return [];
    }
 }
 
 function getCanvasTextInSteps() {
    // Return a list of images representing steps to create a final image.
    try {
        const dataURLs = [];
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 240;
        canvas.height = 60;
        context.textBaseline = 'alphabetic';
        context.fillStyle = '#f60';
        context.fillRect(100, 1, 62, 20);
        dataURLs.push(canvas.toDataURL());

        context.fillStyle = '#069';
        context.font = '11pt "Times New Roman"'
        const printedText = 'Cwm fjordbank gly ';
        context.fillText(printedText, 2, 15);
        dataURLs.push(canvas.toDataURL());
        
        const t1 = context.measureText(printedText, 2, 15);
        const emoji = String.fromCharCode(55357, 56835);
        context.fillText(emoji, 2 + t1.width, 15);
        dataURLs.push(canvas.toDataURL());
        context.fillStyle = 'rgba(102, 204, 0, 0.2)';
        context.font = '18pt Arial';
        context.fillText(printedText, 4, 45);
        dataURLs.push(canvas.toDataURL());

        const t2 = context.measureText(printedText, 4, 45);
        context.fillText(emoji, 4 + t2.width, 45);
        dataURLs.push(canvas.toDataURL());
        return dataURLs;
    } catch (e) {
        console.log('Error getting canvas text:', e);
        return '';
    }
 }

 // Need a dumb hash function that will work in Qualtrics JS environment
 // From https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
const testStr = 'hashCodeTest'; 
console.log(testStr, hashCode(testStr));

function getFingerprintJsComponentValue(component) {
    try { 
        return JSON.stringify(fingerprintJsComponents[component].value);
    } catch(e) {
        console.error('Error flattening component: ', component, e);
        return;
    }
}

function getFingerprintJsComponentList(component, depth) {
    try { 
        return JSON.stringify(fingerprintJsComponents[component].value.flat(depth)); 
    } catch(e) {
        console.error('Error flattening component: ', component, e);
        return;
    }
}

function getFingerprint(attributesToValues) {
    // Returns a promise
    // Make a canonical string representing the attributes.
    // But exclude 'cookies enabled' because this is specific to the site.
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
    // Exclude 'Cookies enabled' because it is specific to the site.
    let result = '';
    for (const attributeName of Object.keys(attributesToValues).sort()) {
        if (attributeName === 'Cookies enabled') { continue; }
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
    let csv = Papa.unparse({'fields':['Attribute', 'Value'], 'data':csvData});
    if (isDebug) {
        // set up the test share button so that click downloads the csv
        let a = document.getElementById('download-csv');
        a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
        a.setAttribute('download', 'attributes-values.csv');
    }
    return new Blob([csv], {type:'text/csv'});
}

let dataContainerElt = document.getElementById('data-container');
let tableContainerElt = document.getElementById('table-container');
let rowsCountElt = document.getElementById('rows-count');
dataContainerElt.style.display = 'none';
function buildTable(attributesToValues) {
    let totalRows = Object.keys(attributesToValues).length;
    rowsCountElt.appendChild(document.createTextNode(totalRows.toString() + ' rows (scroll)'));
    let tableElt = document.createElement('table');
    var tableBodyElt = document.createElement('tbody');
    // create table header
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
    tableContainerElt.appendChild(tableElt);
    if (showData) {
        dataContainerElt.style.display = 'block';
    } else {
        dataContainerElt.style.display = 'none';
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
    getUADataHighEntropyValues()
    .then(function (_ua) { return FingerprintJS.load() })
    //FingerprintJS.load()
    .then(function(fp) { return fp.get() })
    .then(function(result) { 
        fingerprintJsComponents = result.components;
        return result.components; 
    })
    .then(function(fingerprintComponents) { return getAttributes(fingerprintComponents) })
    .then(function(attributesToValues) {
        attributeToValueMap = attributesToValues;
        csvFile = buildCsvFile(attributesToValues);
        // build the table
        buildTable(attributesToValues);
        // get the fingerprint only for debugging purposes
        getFingerprint(attributesToValues).then(function(fp) {
            fingerprint = fp;
            console.log('Fingerprint:\n'+fingerprint);
            if (isDebug) {
                // show fingerprint
                document.getElementById('fingerprint').innerHTML = fingerprint;
            }
        });
    });
}

let choiceContainerSelector = qualtricsDeclared ? '.QuestionBody' : '.test-choice-container'; // using class for testing to be consistent with qualtrics
let showChoices = function() {
    document.querySelectorAll(choiceContainerSelector).forEach(function(el) {
        el.style.display = 'block';
    });
}

main();
showChoices();

if (qualtricsDeclared) {
    let uploadConsent = true; // default
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
            console.log('set upload consent to ', uploadConsent);
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
    console.log('Qualtrics script bottom');
}
console.log('script bottom');
