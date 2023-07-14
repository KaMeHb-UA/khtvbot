CREATE VIEW distinct_user_updates AS SELECT DISTINCT ON (uid) * FROM updates;
