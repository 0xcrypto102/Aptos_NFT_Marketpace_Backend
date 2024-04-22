CREATE TABLE CollectionOffer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_version VARCHAR(255),
    collection VARCHAR(255),
    creator VARCHAR(255),
    name VARCHAR(255),
    amount INT DEFAULT 0,
    leftAmount INT DEFAULT 0,
    price FLOAT DEFAULT 0,
    timestamp BIGINT DEFAULT 0,
    duration BIGINT DEFAULT 0,
    owner VARCHAR(255) DEFAULT '',
    offer VARCHAR(255) DEFAULT '',
    isforitem BOOLEAN DEFAULT 0,
    slug VARCHAR(255) DEFAULT ''
)