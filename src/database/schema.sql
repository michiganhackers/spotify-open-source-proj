
CREATE TABLE session (
    PRIMARY KEY session_id varchar(8),
    FOREIGN KEY host_id INT,
    access_token varchar(255),
    refresh_token varchar(255)
);

CREATE TABLE users (
    FOREIGN KEY session_id varchar(8),
    PRIMARY KEY user_id INT NOT NULL AUTO_INCREMENT,
    username varchar(255)
);

CREATE TABLE queues (
    song varchar(255),
    artist varchar(255),
    album_cover varchar(255),
    song_id INT NOT NULL AUTO_INCREMENT,
    FOREIGN KEY session_id varchar(8),
    FOREIGN KEY added_by INT
);