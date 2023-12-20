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

This dataset only contains responses from participants who shared their browser attributes data. It contains the browser attributes as well as the survey responses, with a column for each question response and each browser attribute collected.
