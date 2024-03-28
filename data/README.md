# Data

Data are downloaded directly from Qualtrics to /data/unprocessed/. The unprocessed data are kept private. 

Preprocessed data are made public.

There are two public datasets.
Both datasets include survey responses with consistent columns corresonding to each survey question. For both datasets, a row corresponds to data from one participant, keyed by the `Response ID`.


1. survey-experiment-data.csv

This dataset is used for experiment analysis. It contains all completed responses, whether or not participants shared their browser attributes data. 
It is used to analyze which factors are most closely associated with participants' likelihood to share that data. It includes a flag indicating which experiment arm (`showdata=true/false`) the participant was in. 
It does not include the web browser attributes.

2. survey-and-browser-attributes-data.csv

This dataset only contains responses from participants who shared their browser attributes data (N=8400). It contains the browser attributes as well as the survey responses, with a column for each question response and each browser attribute collected.

This data file is stored in github via git LFS.
To access via git, you must [install git lfs](https://git-lfs.com/) and then use `git lfs pull`.

Please pull this data once and save locally for your own analyses because there are git lfs bandwidth limits.


## Browser attributes collected


| Attributes              | Distinct values | % Unique | Example (most frequent) value                                                                                      |
| ----------------------- | --------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| User agent              | 434             | 2.8      | Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36    |
| Languages               | 264             | 2.4      | en-US,en                                                                                                           |
| Timezone                | 49              | 0.2      | America/New_York                                                                                                   |
| Screen resolution       | 572             | 4.5      | [1920,1080]                                                                                                        |
| Color depth             | 3               | 0        | 24                                                                                                                 |
| Platform                | 12              | 0        | Win32                                                                                                              |
| Touch points            | 11              | 0        | 0                                                                                                                  |
| Hardware concurrency    | 24              | 0.1      | 4                                                                                                                  |
| Device memory           | 7               | 0        | 8                                                                                                                  |
| WebGL Vendor            | 3               | 0        | WebKit                                                                                                             |
| WebGL Unmasked Vendor   | 36              | 0.1      | Google Inc. (Intel)                                                                                                |
| WebGL Renderer          | 36              | 0.1      | WebKit WebGL                                                                                                       |
| WebGL Unmasked Renderer | 654             | 3.2      | Apple GPU                                                                                                          |
| Fonts                   | 555             | 4.7      | ["Gill Sans","Helvetica Neue","Menlo"]                                                                             |
| Plugins                 | 214             | 2.4      | ["PDF Viewer","Chrome PDF Viewer","Chromium PDF Viewer","Microsoft Edge PDF Viewer","WebKit built-in PDF"]         |
| Local storage           | 1               | 0        | TRUE                                                                                                               |
| Cookies enabled         | 2               | 0        | TRUE                                                                                                               |
| UA high entropy values  | 903             | 6.4      |                                                                                                                    |
| Canvas text             | 951             | 7.9      | data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAA8CAYAAABYfzddAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpA... |
| Canvas geometry         | 522             | 4.9      | data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAAAAXNSR0IArs4c6QAAGWpJREFUeF7tnQl81NW1x793J... |
| Canvas text hashed      | 951             | 7.9      | [922093378,-1490499838,-1506162041,-986675839,651032246]                                                           |
| Canvas geometry hashed  | 522             | 4.9      | [-1339238269,-218892239,25977246,-975268297]               

The table above includes the number of distinct values in our dataset for each attribute, and the most frequently occurring value is provided as an example.

We collected all browser attributes via client-side JavaScript that we included in a webpage that participants loaded into their browser when taking the survey, similarly to common fingerprinting scripts.

The following attributes were collected via the [open license](https://github.com/fingerprintjs/fingerprintjs/blob/d2a1f546b98971cbdd41329912ad91dac734a468/LICENSE) version of the [FingerprintJS (v3) library](https://github.com/fingerprintjs/fingerprintjs/tree/v3):

Timezone, Screen resolution, Color depth, Platform, Touch points, Fonts, Plugins, Local storage, Cookies enabled.

The other attributes were collected via additional scripting.

#### User agent:
Same as the User-Agent HTTP header; it helps servers better identify the application, operating system, vendor, and/or version to better serve the user content. 

Collected via `window.navigator.userAgent'.

#### Languages:
Same as the Accept-Language HTTP header; represents the user's preferred languages.

Collected via `navigator.languages`.

#### Timezone:
Represents the user's current timezone, and is subject to change with the user's location. 

Collected via FingerprintJS.

#### Screen resolution:
Indicates screen width, height pair, accessed via the screen property.

Collected via FingerprintJS.

#### Color depth:
The depth of the device screen's color palette in bits per pixel (1, 4, 8, 15, 16, 24, 32, or 48).
Accessed via `window.screen.colorDepth`.

Collected via FingerprintJS.

#### Platform:
Identifies the platform on which the user's browser is running.

Collected via FingerprintJS.

#### Touch points:
The maximum number of simultaneous touch contact points supported by the device. 
Accessed via `navigator.maxTouchPoints` and set to 0 when unavailable.

Collected via FingerprintJS

#### Hardware concurrency:
Represents the number of logical processors available to run threads on the user's computer. Not available in later versions of Safari.

Collected via `navigator.hardwareConcurrency`.

#### Device memory:
To curtail fingerprinting this value is rounded to a nearest value among 0.25, 0.5, 1, 2, 4, 8.

Collected via `navigator.deviceMemory`.


#### WebGL:
WebGL (Web Graphics Library) is a JavaScript API that draws interactive 2D and 3D graphics. We access the WebGL attributes via the webgl context after creating a canvas element.

We access the WebGL "Unmasked" Vendor and Renderer attributes by further querying the `WEBGL_debug_renderer_info` extension.
The availability of these WebGL Unmasked attributes is dependent on the privacy settings in the browser.

#### Fonts:
This is a list of fonts representing a subset of fonts available to the browser, as only the common fonts are tested for.

Collected via FingerprintJS.


#### Plugins:
Accessible via `navigator.plugins`.

Collected via FingerprintJS.

#### Local storage:
Boolean indicating whether the window localStorage property is accessible.

Collected via FingerprintJS.

#### Cookies enabled:
Boolean indicating whether cookies can be set.

Collected via FingerprintJS.

#### UA high entropy values:
Part of the recently developed User-Agent Client Hints API, which was designed to reduce passive fingerprinting risks.
At the time of data collection, this API was not yet a Web standard.

Collected via the `navigator.userAgentData.getHighEntropyValues` API called with a list of the following parameters: 'architecture', 'model', 'platform', 'platformVersion'.

#### Canvas elements:
Canvas fingerprinting was described in 2012 by Mowery and Shacham and studied on the Web at scale in 2014 by Acar et al.
It is achieved by performing drawing operations in an HTML5 Canvas element and then reading and hashing the resulting data. Since drawing operations can render differently depending on device software and hardware characteristics, this method helps produce a fingerprint. 

The open source FingerprintJS library draws two different canvases, referred to as the "Canvas text" and "Canvas geometry" and collects the fingerprintable data from the canvas element via `toDataURL()`.

We use the same drawing operations to render these same canvases and similarly read the data via `toDataURL()`.

The resulting images can be viewed by inserting the returned values directly into the browser. We display examples below.

##### Canvas Geometry

![Canvas geometry](./canvas/geometry4.png "Geometry")

##### Canvas Text
![Canvas text](./canvas/text5.png "Text")


In order to better study canvas fingerprinting, we also broke the drawing operations for each canvas into a list of steps, and then read and hashed the dataURL after each step.
The resulting list of hashed values are the "Canvas geometry hashed" and "Canvas text hashed" values collected.

Below we show the steps and resulting images. Each image corresponds to a hash value in the collected lists of hashed values.

##### Text Canvas

Initial Setup


```
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const text = `Cwm fjordbank gly `;
const emoji = String.fromCharCode(55357, 56835);
canvas.width = 240;
canvas.height = 60;
context.textBaseline = 'alphabetic';
```

Step 1
```
context.textBaseline = 'alphabetic';
context.fillStyle = '#f60';
context.fillRect(100, 1, 62, 20);
```
![Canvas text 1](./canvas/text1.png "Text 1")

Step 2
```
context.fillStyle = '#069';
context.font = '11pt "Times New Roman"';
context.fillText(text, 2, 15);
```
![Canvas text 2](./canvas/text2.png "Text 2")


Step 3
```
const t1 = context.measureText(text, 2, 15);
context.fillText(emoji, 2 + t1.width, 15);
```
![Canvas text 3](./canvas/text3.png "Text 3")


Step 4
```
context.fillStyle = 'rgba(102, 204, 0, 0.2)';
context.font = '18pt Arial';
context.fillText(text, 4, 45);
```
![Canvas text 4](./canvas/text4.png "Text 4")

Step 5
```
const t2 = context.measureText(text, 4, 45);
context.fillText(emoji, 4 + t2.width, 45);
```
![Canvas text 5](./canvas/text5.png "Text 5")



##### Geometry Canvas
Initial Setup
```
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 120;
canvas.height = 120;
context.globalCompositeOperation = 'multiply';
```

Step 1
```
context.fillStyle = '#f2f';
context.beginPath();
context.arc(40, 40, 40, 0, Math.PI * 2, true);
context.closePath();
context.fill();
```
![Canvas geometry 1](./canvas/geometry1.png "Geometry 1")



Step 2
```
context.fillStyle = '#2ff';
context.beginPath();
context.arc(80, 40, 40, 0, Math.PI * 2, true);
context.closePath();
context.fill();

```
![Canvas geometry 2](./canvas/geometry2.png "Geometry 2")



Step 3
```
context.fillStyle = '#ff2';
context.beginPath();
context.arc(60, 80, 40, 0, Math.PI * 2, true);
context.closePath();
context.fill();
```
![Canvas geometry 3](./canvas/geometry3.png "Geometry 3")


Step 4
```
context.fillStyle = '#f9c';
context.arc(60, 60, 60, 0, Math.PI * 2, true);
context.arc(60, 60, 20, 0, Math.PI * 2, true);
context.fill('evenodd');
```
![Canvas geometry](./canvas/geometry4.png "Geometry")







## User demographics

| | All |   | Shared data |   | US Census  |
| -------------------------------- | ------------------- | --------- | -------------------------------- | ------------------- | --------- |
| | N   | % | N           | % | %       |
| Total                            | 12461               |           | 8400 |  |  |
| Gender                           |                     |           |  |  |  |
| Female                           | 6076                | 48.8      | 3990 | 47.5 | 50.9 |
| Male                             | 6134                | 49.2      | 4227 | 50.3 | 49.1 |
| Other                            | 251                 | 2         | 183 | 2.2 |  |
| Age                              |                     |           |  |  |  |
| 18 - 24 years                    | 1727                | 13.9      | 1302 | 15.5 | 11.9 |
| 25 - 34 years                    | 4136                | 33.2      | 2859 | 34 | 17.3 |
| 35 - 44 years                    | 3039                | 24.4      | 2024 | 24.1 | 16.8 |
| 45 - 54 years                    | 1803                | 14.5      | 1158 | 13.8 | 15.3 |
| 55 - 64 years                    | 1164                | 9.3       | 712 | 8.5 | 15.7 |
| 65 or older                      | 592                 | 4.8       | 345 | 4.1 | 22.9 |
| Household income                 |                     |           |  |  |  |
| Less than $25,000                | 1594                | 12.8      | 1097 | 13.1 | 15.5 |
| $25,000 - $49,999                | 2724                | 21.9      | 1842 | 21.9 | 17.9 |
| $50,000 - $74,999                | 2554                | 20.5      | 1692 | 20.1 | 18.7 |
| $75,000 - $99,999                | 1918                | 15.4      | 1267 | 15.1 | 12.1 |
| $100,000 - $149,999              | 2042                | 16.4      | 1411 | 16.8 | 15.1 |
| $150,000 or more                 | 1363                | 10.9      | 951 | 11.3 | 20.7 |
| Prefer not to say                | 266                 | 2.1       | 140 | 1.7 |  |
| Hispanic origin                  |                     |           |  |  |  |
| Yes                              | 1343                | 10.8      | 923 | 11 | 19.1 |
| Race                             |                     |           |  |  |  |
| White                            | 8832                | 70.9      | 5911 | 70.4 | 75.5 |
| Black or African American        | 1400                | 11.2      | 938 | 11.2 | 13.6 |
| Asian                            | 1179                | 9.5       | 842 | 10 | 6.3 |
| American Indian/Alaska Native    | 75                  | 0.6       | 53 | 0.6 | 1.3 |
| Native Hawaiian/Pacific Islander | 0                   | 0         | 0 | 0 | 0.3 |
| Other or mixed                   | 975                 | 7.8       | 656 | 7.8 | 3 |

US Census data sources:

Age and sex  data are from
(we limit data to the 18+ population):
> Monthly Population Estimates by Age, Sex, Race, and Hispanic Origin for the United States: April 1, 2020 to July 1, 2022 (With short-term projections to December 2023)

U.S. household income data are from: Table HINC-01. Selected Characteristics of Households by Total Money Income in 2022.
> Census Bureau, Current Population Survey, 2023 Annual Social and Economic Supplement (CPS ASEC).

Race and Hispanic origin data are from:
> U.S. Census Bureau, American Community Survey (ACS).
Accessed via "QuickFacts" December 2023: https://www.census.gov/quickfacts/fact/table/US/RHI725222#RHI725222

In order to make our data comparable to US Census data, we report on races "alone" and group all responses with either multiple race selections or "Other" to "Other or mixed" and compare this to Census data for "Two or More Races".


### Geographic distribution

| US state/territory |  US Census || All participants    |  |   Shared data |    | 
| -------------------- | -------- | ---- | ---- | ---- | --- | ---- |
|                      | n        | %    | n    | %    | n   | %    |
| Alabama              | 3977628  | 1.5  | 176  | 1.4  | 118 | 1.4  |
| Alaska               | 557899   | 0.2  | 11   | 0.1  | 9   | 0.1  |
| Arizona              | 5848310  | 2.2  | 254  | 2    | 174 | 2.1  |
| Arkansas             | 2362124  | 0.9  | 99   | 0.8  | 65  | 0.8  |
| California           | 30519524 | 11.5 | 1361 | 10.9 | 929 | 11.1 |
| Colorado             | 4662926  | 1.8  | 180  | 1.4  | 125 | 1.5  |
| Connecticut          | 2894190  | 1.1  | 124  | 1    | 88  | 1    |
| Delaware             | 819952   | 0.3  | 42   | 0.3  | 30  | 0.4  |
| District of Columbia | 552380   | 0.2  | 31   | 0.2  | 22  | 0.3  |
| Florida              | 18229883 | 6.9  | 916  | 7.4  | 634 | 7.5  |
| Georgia              | 8490546  | 3.2  | 475  | 3.8  | 327 | 3.9  |
| Hawaii               | 1141525  | 0.4  | 35   | 0.3  | 15  | 0.2  |
| Idaho                | 1497384  | 0.6  | 48   | 0.4  | 27  | 0.3  |
| Illinois             | 9844167  | 3.7  | 489  | 3.9  | 330 | 3.9  |
| Indiana              | 5274945  | 2.0  | 242  | 1.9  | 169 | 2    |
| Iowa                 | 2476882  | 0.9  | 111  | 0.9  | 75  | 0.9  |
| Kansas               | 2246209  | 0.8  | 109  | 0.9  | 77  | 0.9  |
| Kentucky             | 3509259  | 1.3  | 190  | 1.5  | 135 | 1.6  |
| Louisiana            | 3506600  | 1.3  | 132  | 1.1  | 90  | 1.1  |
| Maine                | 1146670  | 0.4  | 44   | 0.4  | 31  | 0.4  |
| Maryland             | 4818337  | 1.8  | 258  | 2.1  | 167 | 2    |
| Massachusetts        | 5659598  | 2.1  | 266  | 2.1  | 182 | 2.2  |
| Michigan             | 7925350  | 3.0  | 381  | 3.1  | 246 | 2.9  |
| Minnesota            | 4436981  | 1.7  | 190  | 1.5  | 123 | 1.5  |
| Mississippi          | 2259864  | 0.9  | 87   | 0.7  | 62  | 0.7  |
| Missouri             | 4821686  | 1.8  | 227  | 1.8  | 157 | 1.9  |
| Montana              | 897161   | 0.3  | 23   | 0.2  | 15  | 0.2  |
| Nebraska             | 1497381  | 0.6  | 65   | 0.5  | 45  | 0.5  |
| Nevada               | 2508220  | 0.9  | 134  | 1.1  | 85  | 1    |
| New Hampshire        | 1150004  | 0.4  | 50   | 0.4  | 26  | 0.3  |
| New Jersey           | 7280551  | 2.7  | 318  | 2.6  | 211 | 2.5  |
| New Mexico           | 1663024  | 0.6  | 57   | 0.5  | 41  | 0.5  |
| New York             | 15611308 | 5.9  | 780  | 6.3  | 487 | 5.8  |
| North Carolina       | 8498868  | 3.2  | 439  | 3.5  | 302 | 3.6  |
| North Dakota         | 599192   | 0.2  | 22   | 0.2  | 18  | 0.2  |
| Ohio                 | 9207681  | 3.5  | 490  | 3.9  | 331 | 3.9  |
| Oklahoma             | 3087217  | 1.2  | 136  | 1.1  | 95  | 1.1  |
| Oregon               | 3401528  | 1.3  | 206  | 1.7  | 138 | 1.6  |
| Pennsylvania         | 10332678 | 3.9  | 631  | 5.1  | 403 | 4.8  |
| Rhode Island         | 892124   | 0.3  | 48   | 0.4  | 32  | 0.4  |
| South Carolina       | 4229354  | 1.6  | 183  | 1.5  | 123 | 1.5  |
| South Dakota         | 697420   | 0.3  | 18   | 0.1  | 9   | 0.1  |
| Tennessee            | 5555761  | 2.1  | 259  | 2.1  | 171 | 2    |
| Texas                | 22942176 | 8.7  | 969  | 7.8  | 679 | 8.1  |
| Utah                 | 2484582  | 0.9  | 103  | 0.8  | 72  | 0.9  |
| Vermont              | 532828   | 0.2  | 30   | 0.2  | 18  | 0.2  |
| Virginia             | 6834154  | 2.6  | 371  | 3    | 258 | 3.1  |
| Washington           | 6164810  | 2.3  | 321  | 2.6  | 202 | 2.4  |
| West Virginia        | 1417859  | 0.5  | 73   | 0.6  | 52  | 0.6  |
| Wisconsin            | 4661826  | 1.8  | 241  | 1.9  | 170 | 2    |
| Wyoming              | 454508   | 0.2  | 15   | 0.1  | 9   | 0.1  |
| Puerto Rico          | 2707012  | 1.0  | 1    | 0    | 1   | 0    |


US Census data source:
> Estimates of the Total Resident Population and Resident Population Age 18 Years and Older for the United States, Regions, States, District of Columbia, and Puerto Rico: July 1, 2023 (SCPRC-EST2023-18+POP)
