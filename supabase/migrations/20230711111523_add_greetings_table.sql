CREATE TABLE greetings (
	chat_id BIGINT NOT NULL,
	message_id BIGINT NOT NULL,
	datetime TIMESTAMP DEFAULT NOW()
);
