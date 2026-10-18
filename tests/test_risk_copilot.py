import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from risk_copilot import governed_action, risk_summary, transaction_detail

def test_risk_summary_has_synthetic_data():
    s = risk_summary()
    assert s['transactions'] == 25000
    assert s['fraud_labels'] > 0

def test_expected_governance_effects():
    assert governed_action('read','account.balance')['decision'] == 'ALLOW'
    assert governed_action('read','customer.profile',contains_pii=True)['decision'] == 'MODIFY'
    assert governed_action('transfer','customer.account',amount_inr=50000,external=True)['decision'] == 'BLOCK'
    assert governed_action('transfer','customer.account',amount_inr=150000,external=True)['decision'] == 'ESCALATE'

def test_demo_transaction_exists():
    row = transaction_detail('TXN-00000071')
    assert row and row['is_fraud_label'] == 'TRUE'
