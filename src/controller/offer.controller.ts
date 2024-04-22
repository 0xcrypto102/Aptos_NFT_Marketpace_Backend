import { MARKET_ADDRESS } from "../config/constants";
import { I_TOKEN_ID_DATA } from "../types/interfaces";
import { nftItem } from "../db/schema/nftItem";
import { offerItem } from "../db/schema/offerItem";
import { collectionOffer } from "../db/schema/collectionOffer";
import { profileItem } from "../db/schema/profileItem";
import { collectionItem } from "../db/schema/collectionItem";
import { fetchListEvent } from "../utils/graphql";
import { delay } from "../utils/delay";
import con from "../db/dbConfig";
import { exec } from "child_process";

const executeQuery = (con: any, query: string, values: any[]) => {
  return new Promise((resolve, reject) => {
    con.query(query, values, (error: any, results: any, fields: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

export const handleMakeRequest = async (tokenIdData: I_TOKEN_ID_DATA) => {
  async function startFetchMakeEvent(
    account_address: string,
    type: string,
    offset: number
  ) {
    await delay(5000);
    // uncomment this when you are in live website
    const { errors, data } = await fetchListEvent(
      account_address,
      type,
      offset
    );

    if (errors) {
      console.error(errors);
    }

    // Please  delete this temp data when you are in live website
    const newItem = {
      property_version: tokenIdData.property_version,
      collection: tokenIdData.collection,
      creator: tokenIdData.creator,
      name: tokenIdData.name,
      price: data.events[0].data.price,
      owner: `0x${data.events[0].data.seller.substring(2).padStart(64, "0")}`,
      offer: `0x${data.events[0].data.buyer.substring(2).padStart(64, "0")}`,
      duration: data.events[0].data.expiry_time,
      timestamp: data.events[0].data.timestamp,
      slug: `${tokenIdData.collection.replace(/[^A-Z0-9]+/gi, "-")}`,
      isforitem: 1, // 1 for true
    };

    return new Promise((resolve, reject) => {
      try {
        let query = "INSERT INTO offeritem SET ?";
        con.query(query, newItem, (error: any, results: any, fields: any) => {
          if (error) {
            reject(error);
          } else {
            query = "SELECT * FROM offeritem WHERE id = ?";
            con.query(
              query,
              results.insertId,
              (error: any, results: any, fields: any) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(results);
                }
              }
            );
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  let item = startFetchMakeEvent(
    MARKET_ADDRESS!,
    `${MARKET_ADDRESS}::marketplace::MakeOfferEvent`,
    0
  );
  return item;
};

export const handleAcceptRequest = async (
  tokenIdData: I_TOKEN_ID_DATA,
  _timestamp: number
) => {
  async function startFetchMakeEvent(
    account_address: string,
    type: string,
    offset: number
  ) {
    await delay(5000);
    const { errors, data } = await fetchListEvent(
      account_address,
      type,
      offset
    );

    if (errors) {
      console.error(errors);
    }

    // Find the NFT item based on the specified criteria
    const itemRows: any = await executeQuery(
      con,
      "SELECT * FROM nftitem WHERE property_version = ? AND collection = ? AND creator = ? AND name = ?",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
      ]
    );
    if (itemRows.length === 0) return;
    const _item = itemRows[0];
    let _isForSale = _item?.isForSale;

    // Update the NFT item
    await executeQuery(
      con,
      "UPDATE nftitem SET price = 0, offer_id = 0, isForSale = 0, latest_trade_timestamp = ?, owner = ?, latest_trade_price = ? WHERE id = ?",
      [
        new Date(),
        `0x${data.events[0].data.buyer.substring(2).padStart(64, "0")}`,
        data.events[0].data.price,
        _item.id,
      ]
    );

    if (_isForSale) {
      // Find all listed items for the collection that are for sale
      const listedItems: any = await executeQuery(
        con,
        "SELECT * FROM nftitem WHERE collection = ? AND isForSale = 1 ORDER BY price ASC",
        [tokenIdData.collection]
      );

      let listedItem = listedItems[0];

      //Find the  associated collection item
      const collectedItemRows: any = await executeQuery(
        con,
        "SELECT * FROM collectionitem WHERE  collection = ? AND creator = ?",
        [tokenIdData.collection, tokenIdData.creator]
      );
      if (collectedItemRows.length === 0) return;
      const collecteditem = collectedItemRows[0];

      collecteditem.listed = listedItem.length;
      collecteditem.floor = listedItem[0]?.price;
      collecteditem.volume += parseFloat(data.events[0].data.price);

      // Find the distinct owners of items in the collection
      const [ownerRows] = await con.query(
        "SELECT DISTINCT owner FROM nftitem WHERE collection = ?",
        [tokenIdData.collection]
      );

      if (ownerRows.length === 0) return;

      collecteditem.owner = ownerRows.length;

      // Update the collection item
      await executeQuery(
        con,
        "UPDATE Collectionitem SET listed = ?, floor = ?, volume = ?,  owner = ? WHERE id = ?",
        [
          collecteditem.listed,
          collecteditem.floor,
          collecteditem.volume,
          collecteditem.owner,
          collecteditem.id,
        ]
      );
    } else {
      // Find the collection item
      const collectedItemRows: any = await executeQuery(
        con,
        "SELECT * FROM collectionitem WHERE collection = ? AND creator = ?",
        [tokenIdData.collection, tokenIdData.creator]
      );

      if (collectedItemRows.length === 0) return;

      let collecteditem = collectedItemRows[0];
      collecteditem.volume += parseFloat(data.events[0].data.price);

      // Find the distinct owners of items in the collection
      const ownerRows: any = await executeQuery(
        con,
        "SELECT DISTINCT owner FROM nftitem WHERE collection = ?",
        [tokenIdData.collection]
      );

      if (ownerRows.length === 0) return;

      collecteditem.owner = ownerRows.length;

      // Update the collection item
      await executeQuery(
        con,
        "UPDATE collectionitem SET volume = ?, owner = ? WHERE id = ?",
        [collecteditem.volume, collecteditem.owners_total, collecteditem.id]
      );
    }
    // Delete the offer item based on specified criteria
    await executeQuery(
      con,
      "DELETE FROM offeritem WHERE property_version = ? AND collection = ? AND creator = ? AND name = ? ",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
      ]
    );

    // Find offer items for specified criteria
    const offeritems: any = await executeQuery(
      con,
      "SELECT * FROM offeritem WHERE property_version = ? AND collection = ? AND creator = ? AND name = ?",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
      ]
    );

    return offeritems;
  }
  let item = startFetchMakeEvent(
    MARKET_ADDRESS!,
    `${MARKET_ADDRESS}::marketplace::AcceptOfferEvent`,
    0
  );
  return item;
};

export const handleCancelRequest = async (
  tokenIdData: I_TOKEN_ID_DATA,
  _timestamp: number
) => {
  async function startFetchMakeEvent(
    account_address: string,
    type: string,
    offset: number
  ) {
    await delay(5000);
    const { errors, data } = await fetchListEvent(
      account_address,
      type,
      offset
    );

    if (errors) {
      console.error(errors);
    }

    // Delete the offer item based on specifed criteria
    await executeQuery(
      con,
      "DELETE FROM offeritem WHERE property_version = ? AND collection = ? AND creator = ? AND name = ? AND timestamp = ?",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
        _timestamp,
      ]
    );

    // Find offer items for specified criteria after deletion
    const itemRows = await executeQuery(
      con,
      "SELECT * FROM offeritem WHERE property_version = ? AND collection = ? AND creator = ? AND name = ?",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
      ]
    );

    return itemRows;
  }
  let item = startFetchMakeEvent(
    MARKET_ADDRESS!,
    `${MARKET_ADDRESS}::marketplace::CancelOfferEvent`,
    0
  );
  return item;
};

export const fetchMakeOffer = async (tokenIdData: I_TOKEN_ID_DATA) => {
  return new Promise((resolve, reject) => {
    try {
      const query =
        "SELECT * FROM offeritem WHERE property_version = ? AND collection = ? AND creator = ? AND name = ? ORDER BY price DESC";
      const values: any[] = [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
      ];
      con.query(query, values, (error: any, results: any, fields: any) => {
        if (error) {
          reject(error);
        } else {
          if (results === undefined) resolve(null);
          resolve(results);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const OfferByAddress = async (_address: string, _owner: string) => {
  let item;
  if (_owner) {
    item = await executeQuery(
      con,
      "SELECT * FROM offeritem WHERE owner = ? ORDER BY price DESC",
      [_owner]
    );
  } else {
    item = await executeQuery(
      con,
      "SELECT * FROM offeritem WHERE offer = ? ORDER BY price DESC",
      [_address]
    );
  }

  return item;
};

export const CollectionOfferByAddress = async (
  _address: string,
  _owner: string
) => {
  let item;
  if (_owner) {
    item = await executeQuery(
      con,
      "SELECT * FROM collectionoffer WHERE owner = ? ORDER BY price DESC",
      [_owner]
    );
  } else {
    item = await executeQuery(
      con,
      "SELECT * FROM collectionoffer WHERE offer = ? AND leftAmount >= 1 ORDER BY price DESC",
      [_address]
    );
  }
  return item;
};

export const handleCollectRequest = async (tokenIdData: I_TOKEN_ID_DATA) => {
  async function startFetchMakeEvent(
    account_address: string,
    type: string,
    offset: number
  ) {
    await delay(5000);
    const { errors, data } = await fetchListEvent(
      account_address,
      type,
      offset
    );

    if (errors) {
      console.error(errors);
    }
    let _slug = `0x${data.events[0].data.buyer.substring(2).padStart(64, "0")}`;

    let [newItems] = await con.query(
      "INSERT INTO collectionoffer (property_version,collection,creator,name,price,offer,duration,timestamp,amount,leftAmount,slug,isforitem",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
        data.events[0].data.price_per_token,
        _slug,
        data.events[0].data.expiry_time,
        data.events[0].data.created_at,
        data.events[0].data.amount,
        data.events[0].data.amount,
        `${tokenIdData.collection?.replace(
          /[^A-Z0-9]+/gi,
          "-"
        )}-${tokenIdData.creator.substring(61)}`,
        0,
      ]
    );
    let newItem = newItems[0];

    const [topoffer] = await con.query(
      "SELECT * FROM collectionoffer WHERE slug = ? ORDER BY price DESC LIMIT 1",
      [_slug]
    );
    if (!topoffer) return;

    const [collectionData] = await con.query(
      "SELECT * FROM collectionitem WHERE slug = ? LIMIT 1",
      [_slug]
    );
    if (!collectionData) return;

    collectionData.topoffer = topoffer[0]?.price / 100000000;
    await con.execute("UPDATE collectionitem SET topoffer = ? WHERE slug = ?", [
      collectionData.topoffer,
      _slug,
    ]);

    // let item = await offerItem
    //   .find({
    //     "key.property_version": tokenIdData.property_version,
    //     "key.token_data_id.collection": tokenIdData.token_data_id.collection,
    //     "key.token_data_id.creator": tokenIdData.token_data_id.creator,
    //     "key.token_data_id.name": tokenIdData.token_data_id.name,
    //   })
    //   .exec();
    return newItem;
  }
  let item = startFetchMakeEvent(
    MARKET_ADDRESS!,
    `${MARKET_ADDRESS}::marketplace::CreateCollectionOfferEvent`,
    0
  );
  return item;
};

export const handleCollectAcceptRequest = async (
  tokenIdData: I_TOKEN_ID_DATA
) => {
  async function startFetchMakeEvent(
    account_address: string,
    type: string,
    offset: number
  ) {
    await delay(5000);
    const { errors, data } = await fetchListEvent(
      account_address,
      type,
      offset
    );
    if (errors) {
      console.error(errors);
    }

    const [results] = await con.execute(
      "SELECT * FROM nftitem WHERE property_version = ? AND collectioncreator = ? AND creator = ? AND name = ?",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
      ]
    );
    const _item = results[0];
    if (!_item) return;
    let _isForSale = _item?.isForSale;

    _item.price = 0;
    _item.offer_id = 0;
    _item.isForSale = false;
    _item.owner = `0x${data.events[0].data.buyer
      .substring(2)
      .padStart(64, "0")}`;
    await con.execute(
      "UPDATE nftitem SET price = ?, offer_id = ?, isForSale = ?, owner = ? WHERE property_version = ? AND collection = ? AND creator = ? AND name = ?",
      [
        0,
        0,
        0,
        _item.owner,
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
      ]
    );
    if (_isForSale) {
      const [listedItem] = await con.execute(
        "SELECT * FROM nftitem WHERE collection = ? AND isForSale = ? ORDER BY price ASC",
        [tokenIdData.collection, 1]
      );

      const [collecteditem] = await con.execute(
        "SELECT * FROM CollectionItem WHERE  collection_name = ? AND creator = ? LIMIT 1",
        [tokenIdData.collection, tokenIdData.creator]
      );

      if (!collecteditem) return;
      const listedItemCount = listedItem.length;
      collecteditem.listed = listedItemCount;
      collecteditem.floor = listedItemCount > 0 ? listedItem[0]?.price : 0;
      collecteditem.volume += parseFloat(data.events[0].data.price_per_item);
      collecteditem.last_transaction_timestamp = new Date();
      const [itemAmount] = await con.execute(
        "SELECT DISTINCT owner FROM nftitem WHERE collection = ?",
        [tokenIdData.collection]
      );

      if (itemAmount) {
        collecteditem.owner = itemAmount.length;
      }

      if (!itemAmount) return;
      await con.execute(
        "UPDATE collectionitem SET listed = ?, floor = ?, volume = ?, last_transaction_timestamp = ?, owner = ? WHERE property_version = ? AND collection_name = ? AND creator = ?",
        [
          collecteditem.listed,
          collecteditem.floor,
          collecteditem.volume,
          collecteditem.last_transaction_timestamp,
          collecteditem.owner,
          tokenIdData.property_version,
          tokenIdData.collection,
          tokenIdData.creator,
        ]
      );
    } else {
      const [collecteditem] = await con.execute(
        "SELECT * FROM collectionitem WHERE  collection_name = ? AND creator = ? LIMIT 1",
        [tokenIdData.collection, tokenIdData.creator]
      );

      if (!collecteditem) return;

      collecteditem.volume += parseFloat(data.events[0].data.price_per_item);
      collecteditem.lastSoldAt = new Date();

      const [itemAmount] = await con.execute(
        "SELECT DISTINCT owner FROM nftitem WHERE collection = ?",
        [tokenIdData.collection]
      );

      if (itemAmount) {
        collecteditem.owner = itemAmount.length;
      }

      await con.execute(
        "UPDATE collectionitem SET volume = ?, last_transaction_timestamp = ?, owner = ? WHERE property_version = ? AND collection = ? AND creator = ?",
        [
          collecteditem.volume,
          collecteditem.last_transaction_timestamp,
          collecteditem.owner,
          tokenIdData.property_version,
          tokenIdData.collection,
          tokenIdData.creator,
        ]
      );
    }

    const [collectionOffer] = await con.execute(
      "SELECT * FROM collectionoffer WHERE property_version = ? AND collection = ? AND creator = ? AND name = ? AND price = ? LIMIT 1",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        "",
        data.events[0].data.price_per_item,
      ]
    );

    if (!collectionOffer) return;
    if (collectionOffer.leftAmount > 0) {
      await con.execute(
        "UPDATE collectionoffer SET leftAmount = leftAmount - 1 WHERE property_version = ? AND collection = ? AND creator = ? AND name = ? AND price = ?",
        [
          tokenIdData.property_version,
          tokenIdData.collection,
          tokenIdData.creator,
          "",
          data.events[0].data.price_per_item,
        ]
      );
    }

    const [items] = await con.execute(
      "SELECT * FROM collectionoffer WHERE property_version = ? AND collection = ? AND creator = ? AND name = ? AND price = ?",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        "",
        data.events[0].data.price_per_item,
      ]
    );

    return items;
  }
  let item = startFetchMakeEvent(
    MARKET_ADDRESS!,
    `${MARKET_ADDRESS}::marketplace::SellCollectionOfferEvent`,
    0
  );
  return item;
};

export const handleCollectCancelRequest = async (
  tokenIdData: I_TOKEN_ID_DATA,
  _timestamp: number
) => {
  async function startFetchMakeEvent(
    account_address: string,
    type: string,
    offset: number
  ) {
    await delay(5000);
    const { errors, data } = await fetchListEvent(
      account_address,
      type,
      offset
    );

    if (errors) {
      console.error(errors);
    }

    await con.execute(
      "DELETE FROM collectionoffer WHERE property_version = ? AND collection = ? AND creator = ? AND timestamp = ?",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        _timestamp,
      ]
    );

    const [item] = await con.execute(
      "SELECT * FROM collectionoffer WHERE property_version = ? AND collection = ? AND creator = ?",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
      ]
    );
    return item;
  }
  let item = startFetchMakeEvent(
    MARKET_ADDRESS!,
    `${MARKET_ADDRESS}::marketplace::CancelCollectionOfferEvent`,
    0
  );
  return item;
};

export const fetchCollectOffer = async (tokenIdData: I_TOKEN_ID_DATA) => {
  return new Promise((resolve, reject) => {
    try {
      const query =
        "SELECT * FROM collectionoffer WHERE " +
        "property_version = ? AND " +
        "collection = ? AND " +
        "creator = ? AND " +
        "name = ? AND " +
        "leftAmount >= 1 " +
        "ORDER BY price DESC";
      const values: any[] = [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
      ];
      con.query(query, values, (error: any, results: any, fields: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const fetchCollectOfferBySlug = async (_slug: string) => {
  return new Promise((resolve, reject) => {
    try {
      con.query(
        "SELECT co.*, pi.* FROM collectionoffer co " +
          "LEFT JOIN profileitem pi ON co.offer = pi.address " +
          "WHERE co.slug = ? " +
          "ORDER BY co.price DESC",
        [_slug],
        (error: any, results: any, fields: any) => {
          if (error) {
            console.log("Error:", error);
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    } catch (error) {
      throw error;
    }
  });
};

export const receivedByAddress = async (_owner: string) => {
  // Select from nftItem with JOIN to CollectionOffer
  const ownedNftsResults: any = await executeQuery(
    con,
    "SELECT ni.*, co.* FROM nftitem ni " +
      "LEFT JOIN collectionoffer co ON ni.slug = co.slug " +
      "WHERE ni.owner = ? " +
      "ORDER BY ni.price DESC",
    [_owner]
  );

  const ownedNfts = ownedNftsResults; // Assuming you expect multiple results
  // Process the results to map them to the structure you need
  const items = await Promise.all(
    ownedNfts.map(async (token: any, i: number) => {
      // Process each token and fetch corresponding collectionOffer
      const collectionOfferResults: any = await executeQuery(
        con,
        "SELECT * FROM collectionoffer " +
          "WHERE slug = ? AND leftAmount >= 1 " +
          "ORDER BY price DESC",
        [token.slug]
      );

      const collectionOffer = collectionOfferResults; // Assuming you expect multiple results
      const _item = collectionOffer?.map((item: any) =>
        Object.assign(item, { key: token.key })
      );

      return [..._item];
    })
  );
  return items;
};

export const receivedItemByAddress = async (_owner: string) => {
  // Select from nftItem with JOIN to offerItem
  const ownedNftsResults: any = await executeQuery(
    con,
    "SELECT ni.* FROM nftitem ni " +
      "LEFT JOIN offeritem oi ON ni.collection = oi.collection " +
      "WHERE ni.owner = ? " +
      "ORDER BY ni.price DESC",
    [_owner]
  );

  const ownedNfts = ownedNftsResults; // Assuming you expect multiple results

  // Process the results to map them to the structure you need
  const items = await Promise.all(
    ownedNfts.map(async (token: any, i: number) => {
      // Process each token and fetch corresponding offerItem
      const offerItemResults: any = await executeQuery(
        con,
        "SELECT * FROM offeritem " +
          "WHERE collection = ? AND name = ? " +
          "ORDER BY price DESC",
        [token.collection, token?.name]
      );

      const offerItem = offerItemResults; // Assuming you expect multiple results

      return offerItem;
    })
  );

  return items;
};
