-- RuntimeOS policy concepts mirrored into Snowflake for auditable analytics.
INSERT INTO RUNTIMEOS_HACK.RISK.AGENT_ACTIONS VALUES
  ('demo-allow-001', CURRENT_TIMESTAMP(), 'banking-analyst-agent', 'read', 'account.balance', 'customer support', 18, 'ALLOW', 'P-READ-BALANCE', FALSE, FALSE, 'low-risk read'),
  ('demo-modify-001', CURRENT_TIMESTAMP(), 'banking-analyst-agent', 'read', 'customer.profile', 'loan assistance', 62, 'MODIFY', 'P-MASK-PII', TRUE, FALSE, 'sensitive customer data'),
  ('demo-block-001', CURRENT_TIMESTAMP(), 'payment-agent', 'transfer', 'customer.account', 'external transfer', 95, 'BLOCK', 'P-EXTERNAL-PII', TRUE, TRUE, 'sensitive PII to external destination'),
  ('demo-escalate-001', CURRENT_TIMESTAMP(), 'payment-agent', 'transfer', 'customer.account', 'high-value transfer', 91, 'ESCALATE', 'P-HIGH-VALUE', FALSE, TRUE, 'high-value transaction requires human approval');
