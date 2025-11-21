
CREATE TABLE sessions (
    session_id varchar(8),
    host_id INT,
    access_token text,
    refresh_token text,
    expiration text,
    PRIMARY KEY (session_id)
);


CREATE TABLE users (
    session_id varchar(8),
    user_id SERIAL,
    username text,
    like_count INT DEFAULT 0,
    skip_count INT DEFAULT 0,
    PRIMARY KEY (user_id),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);


CREATE TABLE queues (
    -- song_id SERIAL, -- TODO: put this back
    song_id text,
    song_name text,
    artist_name text,
    album_cover text,
    like_count INT DEFAULT 0,
    vote_skip_count INT DEFAULT 0,
    placement INT NOT NULL,
    session_id varchar(8),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);


CREATE TABLE likes (
    user_id INT,
    song_id INT
    -- TODO: make these foreign keys
);


CREATE TABLE skip_votes ( 
    user_id INT,
    song_id INT
    -- TODO: make these foreign keys
);


ALTER TABLE sessions ADD CONSTRAINT fk_session_host_id
    FOREIGN KEY (host_id) REFERENCES users(user_id);