DROP VIEW distinct_user_updates;

CREATE FUNCTION distinct_updates(
	group_id int8,
	amount int8
) RETURNS SETOF updates AS
$$
BEGIN
	RETURN QUERY SELECT updates.* FROM updates INNER JOIN (
		SELECT DISTINCT uid, MAX(received_at) FROM updates WHERE chat_id = group_id GROUP BY uid ORDER BY MAX(received_at) DESC LIMIT amount
	) AS dynamic ON updates.uid = dynamic.uid AND updates.received_at = dynamic.max ORDER BY received_at DESC;
END
$$
LANGUAGE plpgsql;
