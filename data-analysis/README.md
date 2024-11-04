# Data analysis

Notebooks analyzing the survey responses and the relationships between user demographics and fingerprinting risks are included in a [submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules): `/how-unique-is-whose-web-browser`.


### To run the notebooks

The jupyter notebooks were developed for Python 3 in Google's [Colab environment](https://colab.research.google.com/) and can be run there.


To run the notebooks that use the browser data, download `survey-and-browser-attributes-data.csv` via instructions in /data.
You may need to switch between `.csv` and `.txt` file extensions.

By default, some flags are set to avoid rerunning time-consuming computations. E.g. in `fingerprinting_risk_by_demographics.ipynb`: `do_compute_p_male_entropy = False`. If you wish to reproduce these analyses, to run for the first time change the `False` flags to `True`.
