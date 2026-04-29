CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    transaction_date DATE NOT NULL,
    currency TEXT NOT NULL,
    amount FLOAT NOT NULL,
    category TEXT NOT NULL,
    envelope TEXT NOT NULL DEFAULT 'default',
    description TEXT NOT NULL DEFAULT '',
    message_id TEXT NOT NULL DEFAULT '',
    confirm BOOLEAN NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_message_id
ON transactions(message_id)
WHERE message_id != '';
