CREATE TABLE ProfileItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(255) DEFAULT '',
    name VARCHAR(255) DEFAULT '',
    bio VARCHAR(255) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    website VARCHAR(255) DEFAULT '',
    twitter VARCHAR(255) DEFAULT '',
    instagram VARCHAR(255) DEFAULT '',
    coverImage VARCHAR(255) DEFAULT '',
    avatarImage VARCHAR(255) DEFAULT '',
    isVerifeid VARCHAR(255) DEFAULT '',
    code VARCHAR(255) DEFAULT ''
)