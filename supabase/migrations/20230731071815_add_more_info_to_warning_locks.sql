ALTER TABLE warning_locks ADD COLUMN admin_id BIGINT;
ALTER TABLE warning_locks ADD COLUMN created_at TIMESTAMP DEFAULT NOW();

DROP FUNCTION acquire_warn_session;

CREATE FUNCTION acquire_warn_session(
	group_id BIGINT,
	user_id BIGINT,
	admin BIGINT
) RETURNS UUID AS
$$
DECLARE
	session_id UUID;
BEGIN
	PERFORM * FROM warning_locks WHERE chat_id = group_id AND uid = user_id;
	IF NOT FOUND THEN
		SELECT uuid_generate_v4() INTO session_id;
		INSERT INTO warning_locks (session, chat_id, uid, admin_id) VALUES (session_id, group_id, user_id, admin);
		RETURN session_id;
	END IF;
END
$$
LANGUAGE plpgsql;
