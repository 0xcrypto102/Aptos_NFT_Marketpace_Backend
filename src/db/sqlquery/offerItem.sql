CREATE TABLE OfferItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_version VARCHAR (255),
    collection VARCHAR(255),
    creator VARCHAR(255),
    name VARCHAR(255),
    price FLOAT DEFAULT 0,
    owner VARCHAR(255) DEFAULT "",
    offer VARCHAR(255) DEFAULT "",
    duration BIGINT DEFAULT 0,
    timestamp BIGINT DEFAULT 0,
    slug VARCHAR(255) DEFAULT '',  -- Added comma here
    isforitem BOOLEAN DEFAULT 0    -- No comma needed here as it's the last column
);
