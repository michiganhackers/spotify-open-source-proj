
CREATE TABLE sessions (
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
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE TABLE queues (
    song_id varchar(255),
    song_name varchar(255),
    artist_name varchar(255),
    album_cover varchar(255),
    placement INT NOT NULL,
    session_id varchar(8),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

ALTER TABLE sessions ADD CONSTRAINT fk_session_host_id
    FOREIGN KEY (host_id) REFERENCES users(user_id);