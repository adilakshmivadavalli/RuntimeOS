"""Upload bundled CSVs to a Snowflake stage and load them."""
import os
from pathlib import Path
import snowflake.connector

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'

def main():
    cfg = {
        'account': os.environ['SNOWFLAKE_ACCOUNT'],
        'user': os.environ['SNOWFLAKE_USER'],
        'password': os.environ.get('SNOWFLAKE_PASSWORD'),
        'warehouse': os.environ['SNOWFLAKE_WAREHOUSE'],
        'database': 'RUNTIMEOS_HACK',
        'schema': 'RISK',
        'role': os.environ.get('SNOWFLAKE_ROLE'),
    }
    cfg = {k:v for k,v in cfg.items() if v}
    conn = snowflake.connector.connect(**cfg)
    cur = conn.cursor()
    try:
        cur.execute('CREATE DATABASE IF NOT EXISTS RUNTIMEOS_HACK')
        cur.execute('CREATE SCHEMA IF NOT EXISTS RUNTIMEOS_HACK.RISK')
        cur.execute('CREATE OR REPLACE FILE FORMAT RUNTIMEOS_HACK.RISK.CSV_FMT TYPE=CSV SKIP_HEADER=1 FIELD_OPTIONALLY_ENCLOSED_BY='"' NULL_IF=('','NULL')')
        cur.execute('CREATE OR REPLACE STAGE RUNTIMEOS_HACK.RISK.RAW_DATA')
        for filename in ['customers_seed.csv','accounts_seed.csv','transactions_seed.csv','regulatory_knowledge_seed.csv']:
            local = DATA / filename
            cur.execute(f"PUT file://{local.as_posix()} @RUNTIMEOS_HACK.RISK.RAW_DATA AUTO_COMPRESS=TRUE OVERWRITE=TRUE")
        print('Uploaded data. Run snowflake/sql/02_load.sql next (or from Snowsight).')
    finally:
        cur.close(); conn.close()

if __name__ == '__main__':
    main()
