USE vexpy;

CREATE TABLE CollectionItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collection VARCHAR(255),
    creator VARCHAR(255),
    symbol VARCHAR(255),
    description TEXT DEFAULT '',
    website VARCHAR(255),
    email VARCHAR(255),
    twitter VARCHAR(255),
    discord VARCHAR(255),
    telegram VARCHAR(255),
    github VARCHAR(255),
    instagram VARCHAR(255),
    medium VARCHAR(255),
    logo_url VARCHAR(255),
    banner_url VARCHAR(255),
    featured_url VARCHAR(255),
    large_image_url VARCHAR(255),
    attributes JSON,
    create_tx_version INT DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    items_total INT DEFAULT 0,
    owners_total INT DEFAULT 0,
    volume INT DEFAULT 0,
    listed INT DEFAULT 0,
    floor INT DEFAULT 0,
    slug VARCHAR(255) DEFAULT '',
    topoffer INT DEFAULT 0,
    royalty INT DEFAULT 0,
    sales_24h FLOAT DEFAULT 0.00
);