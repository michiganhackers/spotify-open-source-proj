
CREATE TABLE session (
    session_id varchar(8),
    host_id INT,
    access_token varchar(255),
    refresh_token varchar(255),
    PRIMARY KEY (session_id)
);

CREATE TABLE users (
    session_id varchar(8),
    user_id SERIAL,
    username varchar(255),
    PRIMARY KEY (user_id),
    FOREIGN KEY (session_id) REFERENCES session(session_id)
);

CREATE TABLE queues (
    song_name varchar(255),
    artist_name varchar(255),
    album_cover varchar(255),
    placement INT NOT NULL,
    session_id varchar(8),
    added_by INT,
    spotify_url varchar(255),
    FOREIGN KEY (session_id) REFERENCES session(session_id),
    FOREIGN KEY (added_by) REFERENCES users(user_id)
);

ALTER TABLE session ADD CONSTRAINT fk_session_host_id
    FOREIGN KEY (host_id) REFERENCES users(user_id);