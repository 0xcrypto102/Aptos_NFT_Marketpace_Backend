CREATE TABLE NftItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collection VARCHAR(255),
    creator VARCHAR(255),
    name VARCHAR(255),
    asset_id VARCHAR(255),
    property_version VARCHAR(255),
    interact_function VARCHAR(255) DEFAULT '',
    minter VARCHAR(255) DEFAULT '',
    owner VARCHAR(255) DEFAULT '',
    mint_timestamp BIGINT DEFAULT 0,
    mint_transaction_hash VARCHAR(255) DEFAULT '',
    mint_price DECIMAL(10, 2) DEFAULT 0.00,
    content_type VARCHAR(255) DEFAULT '',
    content_uri VARCHAR(255) DEFAULT '',
    token_uri VARCHAR(255) DEFAULT '',
    metadata JSON,
    image_uri VARCHAR(255) DEFAULT '',
    external_link VARCHAR(255) DEFAULT '',
    latest_trade_price DECIMAL(10, 2) DEFAULT 0.00,
    latest_trade_timestamp BIGINT DEFAULT 0,
    latest_trade_transaction_version INT DEFAULT 0,
    latest_trade_transaction_hash VARCHAR(255) DEFAULT '',
    isForSale BOOLEAN DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0.00,
    offer_id INT DEFAULT 0,
    slug VARCHAR(255) DEFAULT ''
);
