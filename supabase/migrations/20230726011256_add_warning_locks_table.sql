CREATE TABLE warning_locks (
	session UUID PRIMARY KEY,
	chat_id BIGINT NOT NULL,
	uid BIGINT NOT NULL
);
