"""Snowpark feature engineering for RuntimeOS BFSI risk intelligence.

Run from Cortex Code / Snowsight with a Snowpark session configured for
RUNTIMEOS_HACK.RISK. The script creates a reproducible feature view/table and
keeps the source transaction data unchanged.
"""
from snowflake.snowpark import Session
from snowflake.snowpark.window import Window
from snowflake.snowpark import functions as F


def build_features(session: Session):
    tx = session.table("RUNTIMEOS_HACK.RISK.TRANSACTIONS")
    account_w = Window.partition_by("ACCOUNT_ID")
    velocity_w = Window.partition_by("ACCOUNT_ID").order_by("TIMESTAMP").range_between(-3600, 0)

    features = (
        tx.select("*")
        .with_column("ACCOUNT_AVG_AMOUNT", F.avg("AMOUNT_INR").over(account_w))
        .with_column("TXN_VELOCITY_1H", F.count("TRANSACTION_ID").over(velocity_w))
        .with_column("CROSS_BORDER_SIGNAL", F.iff(F.col("COUNTRY") != F.lit("IN"), F.lit(1), F.lit(0)))
        .with_column("HIGH_VALUE_SIGNAL", F.iff(F.col("AMOUNT_INR") >= F.lit(100000), F.lit(1), F.lit(0)))
        .with_column("NEW_BENEFICIARY_SIGNAL", F.iff(F.col("IS_NEW_BENEFICIARY"), F.lit(1), F.lit(0)))
        .with_column(
            "MODEL_RISK_FEATURE",
            F.least(
                F.lit(99),
                F.col("RISK_SCORE")
                + F.iff(F.col("TXN_VELOCITY_1H") >= 5, F.lit(12), F.lit(0))
                + F.iff(F.col("COUNTRY") != F.lit("IN"), F.lit(8), F.lit(0))
                + F.iff(F.col("IS_NEW_BENEFICIARY"), F.lit(8), F.lit(0))
            ),
        )
    )
    features.write.mode("overwrite").save_as_table("RUNTIMEOS_HACK.RISK.RISK_FEATURES", table_type="transient")
    return features


if __name__ == "__main__":
    raise SystemExit("Import build_features(session) from Cortex Code or a configured Snowpark job.")
