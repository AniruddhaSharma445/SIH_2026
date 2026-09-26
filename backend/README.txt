SYNTHETIC CRIMINAL NETWORK ANALYSIS DATASET
===============================================

Purpose:
Moderate/easy synthetic data for the SIH 2026 Criminal Network Analysis prototype.
It is designed to exercise:
1. Regex extraction
2. spaCy NER / EntityRuler
3. RapidFuzz entity resolution
4. PostgreSQL storage
5. NetworkX graph construction
6. Communication-spike detection
7. Circular money-flow detection
8. Bridge/multi-source crossover analysis
9. Evidence-backed WHY FLAGGED output

Files:
- persons.csv              Canonical person list (20 people)
- phones.csv               Phone-to-person mapping
- vehicles.csv             Vehicle records
- accounts.csv             Financial account records
- fir_records.txt          12 synthetic FIR/intelligence documents
- cdr.csv                  Synthetic call-detail records
- transactions.csv         Synthetic financial transactions
- relationships_seed.csv   Optional seed relationships for testing graph logic

Important:
- All names, numbers, accounts, vehicles, cases and events are fictional.
- Do not interpret any record as a real allegation.
- The dataset is intentionally small enough to understand manually.

Suggested NLP pipeline:
FIR text
  -> clean/normalize
  -> regex: phone, vehicle, case ID, date
  -> spaCy: PERSON, LOCATION, ORG
  -> normalize names
  -> RapidFuzz candidate matching
  -> confidence score
  -> canonical person ID
  -> relationship extraction
  -> PostgreSQL

Expected demonstrations:
A) Entity resolution:
   "Rahul K Sharma" and "R. Sharma" should resolve toward Rahul Sharma.

B) Communication spike:
   Rahul's phone has a deliberately high number of calls on 2026-08-09.

C) Circular money flow:
   AC-001 -> AC-002 -> AC-003 -> AC-001

D) Multi-source crossover:
   Rahul Sharma appears in FIR, CDR and financial records.

E) Bridge candidate:
   Neeraj Khan / Rahul Sharma / Amit Verma form cross-group links that can be
   explored with betweenness centrality.

Recommended first prototype:
Use the FIR text as the NLP input, then join extracted phones to phones.csv,
persons to persons.csv, and accounts/transactions for cross-source correlation.
