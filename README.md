# Fake Job Posting Detection (ES 335 project)

Live website: https://pramidimahathi-tech.github.io/fraud-job-detection/


## Question

Can we predict whether a job posting is fraudulent using only the information on the posting? One row is one job posting. The target is `fraudulent` (1 = fraud, 0 = genuine). The model ranks postings by suspicion so that a person can review them. It does not prove that a posting is fraud.

## Repository contents

- `ES_335_ML_Project.ipynb`: the full notebook (cleaning, split, baseline, logistic regression, random forest comparison, test evaluation, error analysis, exports).
- `index.html`, `style.css`, `app.js`: the website, a static site hosted on GitHub Pages.
- `model.json`: the weights of the final model, exported from the notebook so the website can score a posting in the browser.
- `examples.json`: example postings (taken from the test set) used by the website.
- `test_scores.csv`: true label and model score for every test posting, used by the website.
- `results/`: saved results (listed below).
- `fraud_model.joblib`: the trained scikit-learn pipeline.
- `requirements.txt`: Python packages.
- `README.md`: this file.

## Data

The dataset is not stored in this repository. Download `fake_job_postings.csv` from Kaggle: https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobposting-prediction

It has 17,880 rows and 18 columns, of which 866 are fraudulent (4.84%). It is the Employment Scam Aegean Dataset (EMSCAD), made public by Vidros et al. (2017); the postings were collected between 2012 and 2014. Put the CSV in the same folder as the notebook. In Google Colab, upload it when the loading cell asks for it.

## Setup and run

1. Install the packages: `pip install -r requirements.txt` (tested with Python 3.13 and scikit-learn 1.6.1).
2. Open `ES_335_ML_Project.ipynb` in Google Colab (the notebook uses Colab's file upload and download, so it is not meant to run locally) and run all cells from top to bottom. The random forest comparison is the slowest cell and takes several minutes.
3. The random seed is 42 everywhere (`RANDOM_STATE`), so the results repeat.
4. 4. The test evaluation cell writes `test_scores.csv` and `fraud_model.joblib`. The last cells write `model.json`, `examples.json` and the files in `results/`.
5. To see the website on your own computer, run `python -m http.server` in the repository folder and open `http://localhost:8000`. This step is optional, because the live website link above works without it.

## Preprocessing and split

- Duplicate postings are removed first (same title, description and requirements; the first copy is kept). 17,880 rows become 15,948 rows, of which 688 are fraud (4.31%).
- Columns dropped: `job_id`, `location`, `salary_range`, `department`, `benefits`, `telecommuting`. Salary range (84% missing) and department (65% missing) are mostly empty, and the ID is only a label. On the training data the dropped columns had very low mutual information with the label, except country (0.018), which was left out for simplicity.
- Missing categories are filled with `Missing`. Missing text is filled with an empty string. The `company_profile` text is dropped and replaced by a yes/no flag `has_company_profile`. Title, description and requirements are joined into one text field (`text_blob` in the notebook).
- Split: stratified 80/20 train/test split with seed 42. Training set: 12,758 postings (550 fraud). Test set: 3,190 postings (138 fraud). `results/split_indices.csv` lists every row; `row_index` is the 0-based row number in the original `fake_job_postings.csv`.
- TF-IDF (5,000 words, English stop words removed, words in at least 5 postings), one-hot encoding of the 5 category columns, and the 3 yes/no flags are all inside a scikit-learn Pipeline. They are fitted on training folds only, so no information from validation or test rows is used.

## Models and evaluation

- Baseline: always predict "genuine".
- Logistic regression (class-balanced). The penalty (L1 or L2) and C (0.01 to 100) were tuned with 5-fold stratified cross-validation scored by PR-AUC. Best setting: L2, C = 10.
- Random forest (200 class-balanced trees). The minimum leaf size (1 or 3) was tuned on the same folds.
- All models were compared with the same 5-fold cross-validation on the training set. The test set was used for one final evaluation of the chosen model. The bootstrap intervals, threshold table and error analysis describe that result only, and no model or setting was changed afterwards. The 0.5 decision threshold was fixed before testing.

Cross-validation on the training set (mean over 5 folds):

| Model | Accuracy | Precision | Recall | F1 | PR-AUC |
|---|---|---|---|---|---|
| Baseline | 0.957 | 0.000 | 0.000 | 0.000 | 0.043 |
| Logistic regression | 0.965 | 0.580 | 0.731 | 0.646 | 0.711 |
| Random forest | 0.971 | 0.954 | 0.353 | 0.514 | 0.732 |

The random forest has a slightly higher PR-AUC, but the difference is within the fold-to-fold variation (about 0.03), so the two models rank postings about equally well. Logistic regression was chosen because it catches many more frauds at the default threshold (recall 0.73 against 0.35) and because its word weights can be explained and run in the browser. The random forest was not scored on the test set.

Final test result for logistic regression (threshold 0.5): accuracy 0.970, precision 0.612, recall 0.812, F1 0.698, PR-AUC 0.806, ROC-AUC 0.976. Confusion matrix: 2,981 genuine and 112 fraud postings classified correctly; 71 genuine postings flagged as fraud; 26 frauds missed.

## Results files (`results/`)

- `split_indices.csv`: train/test membership of every row.
- `logreg_grid_cv.csv` and `rf_grid_cv.csv`: tuning results from cross-validation.
- `model_comparison_cv.csv`: baseline, logistic regression and random forest compared with cross-validation.
- `test_results.csv` and `confusion_matrix.csv`: final test results.
- `bootstrap_intervals.csv`: 95% intervals from 1,000 resamples of the test set.
- `threshold_table.csv`: precision and recall at thresholds from 0.2 to 0.8.
- `error_summary.csv`: summary of all 97 test errors.

## Limitations

- One dataset from one source and period, so results may not hold for current postings.
- Only 138 test frauds, so the intervals are wide.
- The model relies on whether a posting has a company logo and profile, which may reflect how the data was collected.
- About 4 in 10 flagged postings are false alarms, so flagged postings need human review.

## Notes on files

- The raw dataset and any API keys are not stored in this repository.
- `examples.json` contains 11 example postings and 20 verification postings (full text) from the public dataset. It is used for the website demo and to check that the browser scoring matches the Python scores. The three "Borderline" examples were copied by hand from the 20 verification postings; the notebook itself exports 8 labelled examples and the 20 verification postings.
- `.joblib` files can run code when they are loaded, so only open ones from a source you trust.

## Team contributions

**Shared work (both team members):**
- Selected the problem together.
- Carried out the data preprocessing together: removing duplicate postings, dropping weak columns, filling missing values, building the TF-IDF and one-hot encoding pipeline, and making the stratified train/test split.
- Built and deployed the project website together.

**Mahathi: logistic regression.**
- Trained and tuned the logistic regression model (penalty L1 or L2, and strength C, with 5-fold cross-validation).
- This is the final model used on the test set and on the website.

**Samyuktha: random forest.**
- Trained and tuned the random forest model (minimum leaf size 1 or 3, on the same cross-validation folds).
- This is the comparison model, evaluated with cross-validation only.

## AI-use disclosure

We took help of Claude(Anthropic):

- To explain concepts such as TF-IDF, one-hot encoding, ColumnTransformer and cross-validation.
- To help write the website files (`index.html`, `style.css`, `app.js`).
- To help with some of the model training code.
- To review our notebook, results and README and suggest fixes.

We chose the dataset, the question and the models, ran the notebook ourselves, and checked the results.

All reported numbers come from running our notebook.

## References

1. Vidros, S., Kolias, C., Kambourakis, G., and Akoglu, L. (2017). Automatic Detection of Online Recruitment Frauds: Characteristics, Methods, and a Public Dataset. Future Internet, 9(1), 6. https://doi.org/10.3390/fi9010006
2. Kaggle dataset "Real / Fake Job Posting Prediction" (Kaggle user shivamb). https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobposting-prediction
3. Pedregosa, F. et al. (2011). Scikit-learn: Machine Learning in Python. Journal of Machine Learning Research, 12, 2825-2830.
