-- Cortex Search for regulatory/governance evidence.
-- Requires a warehouse with permission to build the service.
CREATE OR REPLACE CORTEX SEARCH SERVICE RUNTIMEOS_HACK.RISK.REGULATORY_SEARCH
  ON CHUNK
  ATTRIBUTES TOPIC, DOC_ID
  WAREHOUSE = RUNTIMEOS_WH
  TARGET_LAG = '1 hour'
  AS SELECT CHUNK, TOPIC, DOC_ID, DOCUMENT_NAME, SECTION_HINT, SOURCE_URL, NOTE
     FROM RUNTIMEOS_HACK.RISK.REGULATORY_SEARCH_SOURCE;

-- Native semantic layer for natural-language analytics / Cortex Analyst.
CREATE OR REPLACE SEMANTIC VIEW RUNTIMEOS_HACK.RISK.RISK_INTELLIGENCE
  TABLES (
    transactions AS RUNTIMEOS_HACK.RISK.RISK_TRANSACTIONS primary key (TRANSACTION_ID)
  )
  DIMENSIONS (
    transactions.TRANSACTION_ID AS transaction_id
      WITH SYNONYMS = ('transaction','txn')
      COMMENT = 'Unique transaction identifier',
    transactions.CUSTOMER_ID AS customer_id
      COMMENT = 'Customer identifier',
    transactions.RISK_LEVEL AS risk_level
      COMMENT = 'Computed risk band',
    transactions.COUNTRY AS country
      COMMENT = 'Transaction country',
    transactions.MERCHANT_CATEGORY AS merchant_category
      COMMENT = 'Merchant category',
    transactions.TRANSACTION_STATUS AS transaction_status
      COMMENT = 'Transaction lifecycle status'
  )
  METRICS (
    transactions.TRANSACTION_COUNT AS COUNT(transactions.TRANSACTION_ID)
      WITH SYNONYMS = ('transactions','txn count'),
    transactions.TOTAL_VALUE_INR AS SUM(transactions.AMOUNT_INR)
      WITH SYNONYMS = ('value','amount'),
    transactions.AVERAGE_RISK_SCORE AS AVG(transactions.RISK_SCORE)
      WITH SYNONYMS = ('average risk','risk score'),
    transactions.FRAUD_LABEL_COUNT AS SUM(IFF(transactions.IS_FRAUD_LABEL, 1, 0))
      WITH SYNONYMS = ('fraud count','fraud labels')
  )
  COMMENT = 'Governed semantic model for RuntimeOS risk intelligence';

-- Optional: native anomaly detection over daily transaction value.
-- Uncomment after validating the required ML privileges and warehouse.
-- CREATE OR REPLACE SNOWFLAKE.ML.ANOMALY_DETECTION RUNTIMEOS_HACK.RISK.DAILY_VALUE_ANOMALY(
--   INPUT_DATA => TABLE(RUNTIMEOS_HACK.RISK.DAILY_ACTIVITY),
--   TIMESTAMP_COLNAME => 'DAY',
--   TARGET_COLNAME => 'TOTAL_VALUE_INR',
--   LABEL_COLNAME => ''
-- );

-- Quick Cortex Search smoke query (run only after the service exists):
-- SELECT PARSE_JSON(
--   SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
--     'RUNTIMEOS_HACK.RISK.REGULATORY_SEARCH',
--     '{"query":"AML suspicious transaction","columns":["DOCUMENT_NAME","SECTION_HINT","GUIDANCE_SUMMARY","SOURCE_URL"],"limit":5}'
--   )
-- );
