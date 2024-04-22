CREATE TABLE Activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_version VARCHAR(255),
    token_data_id_collection VARCHAR(255),
    token_data_id_creator VARCHAR(255),
    token_data_id_name VARCHAR(255),
    price DECIMAL(10, 2) DEFAULT 0.00,
    timestamp BIGINT DEFAULT 0,
    seller VARCHAR(255) DEFAULT '',
    image VARCHAR(255) DEFAULT '',
    buyer VARCHAR(255) DEFAULT '',
    slug VARCHAR(255) DEFAULT '',
    version INT DEFAULT 0
);
