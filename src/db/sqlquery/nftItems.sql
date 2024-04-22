CREATE TABLE NftItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_version VARCHAR(255),
    token_data_id_collection VARCHAR(255),
    token_data_id_creator VARCHAR(255),
    token_data_id_name VARCHAR(255),
    isForSale BOOLEAN DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0.00,
    owner VARCHAR(255) DEFAULT '',
    offer_id INT DEFAULT 0,
    description TEXT DEFAULT '',
    image_uri VARCHAR(255) DEFAULT '',
    metadata JSON,
    token_uri VARCHAR(255) DEFAULT '',
    royalty DECIMAL(10, 2) DEFAULT 0.00,
    collection_name VARCHAR(255) DEFAULT '',
    collection_description TEXT DEFAULT '',
    collection_metadata_uri VARCHAR(255) DEFAULT '',
    slug VARCHAR(255) DEFAULT ''
);