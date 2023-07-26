CREATE FUNCTION acquire_warn_session(
	group_id int8,
	user_id int8
) RETURNS UUID AS
$$
DECLARE
	session_id UUID;
BEGIN
	SELECT * FROM warning_locks WHERE chat_id = group_id AND uid = user_id;
	IF NOT FOUND THEN
		SELECT uuid_generate_v4() INTO session_id;
		INSERT INTO warning_locks (session, chat_id, uid) VALUES (session_id, group_id, user_id);
		RETURN session_id;
	END IF;
END
$$
LANGUAGE plpgsql;
