import con from "../db/dbConfig";
import { arrayFormat, fetchGraphQL, fetchListEvent } from "./graphql";
import axios from "axios";
const fetch = require("node-fetch");
const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));

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

export const getCollectionStatistics = async (
  collection: string,
  creator: string
) => {
  const apiUrl = `${
    process.env.MFTSCAN_API_ENDPOINT
  }apt/statistics/collection/${encodeURIComponent(
    collection
  )}?creator=${encodeURIComponent(creator)}`;
  timer(5000);
  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.NFTSCAN_API_KEY,
    },
  })
    .then((response: { ok: any; status: any; json: () => any }) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(async (data: any) => {
      const query =
        "UPDATE collectionitem SET volume = ?, sales_24h = ? WHERE collection = ?  AND creator = ?";
      const values = [
        data.data.total_volume,
        data.data.sales_24h,
        collection,
        creator,
      ];
      await con.query(query, values, (error: any, results: any) => {
        if (error) {
          console.error("Error inserting data:", error);
        } else {
        }
      });
    })
    .catch((error: any) => {
      // Handle errors
      console.error("Error:", error);
    });
};

export const getNFTsByCreator = async (
  collection_name: string,
  creator_address: string,
  limit: number
) => {
  const apiUrl = `${
    process.env.MFTSCAN_API_ENDPOINT
  }apt/assets/collection/${encodeURIComponent(
    collection_name
  )}?creator=${encodeURIComponent(creator_address)}&limit=${limit}`;
  timer(5000);
  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.NFTSCAN_API_KEY,
    },
  })
    .then((response: { ok: any; status: any; json: () => any }) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(async (data: any) => {
      const content = data.data.content;
      for (let i = 0; i < content.length; i++) {
        const query =
          "INSERT INTO nftitem (collection,creator,name,asset_id,property_version,interact_function,minter,owner,mint_timestamp,mint_transaction_hash,mint_price,content_type,content_uri,token_uri,metadata,image_uri,external_link,latest_trade_price,latest_trade_timestamp,latest_trade_transaction_version,latest_trade_transaction_hash,isForSale,price,offer_id,slug) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        const values = [
          content[i].collection,
          content[i].creator,
          content[i].name, // Corrected reference to token_data_id_name
          content[i].asset_id,
          content[i].property_version,
          content[i].interact_function,
          content[i].minter,
          content[i].owner,
          content[i].mint_timestamp,
          content[i].mint_transaction_hash,
          content[i].mint_price,
          content[i].content_type,
          content[i].content_uri,
          content[i].token_uri,
          content[i].metadata_json,
          content[i].image_uri,
          content[i].external_link,
          content[i].latest_trade_price,
          content[i].latest_trade_timestamp,
          content[i].latest_trade_transaction_version,
          content[i].latest_trade_transaction_hash,
          0,
          0,
          0,
          content[i].collection.replace(/[^A-Z0-9]+/gi, "-"),
        ];

        await con.query(query, values, (error: any, results: any) => {
          if (error) {
            console.error("Error inserting data:", error);
          } else {
          }
        });
      }
    })
    .catch((error: any) => {
      // Handle errors
      console.error("Error:", error);
    });
};

export const getNFTCollectionsByCreator = async (
  collection_name: string,
  creator_address: string
) => {
  const apiUrl = `${
    process.env.MFTSCAN_API_ENDPOINT
  }apt/collections/${encodeURIComponent(
    collection_name
  )}?creator=${encodeURIComponent(creator_address)}`;
  timer(5000);
  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.NFTSCAN_API_KEY,
    },
  })
    .then((response: { ok: any; status: any; json: () => any }) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(async (data: any) => {
      const collection = data.data;
      const query =
        "INSERT INTO collectionitem (collection,creator,symbol,description,website,email,twitter,discord,telegram,github,instagram,medium,logo_url,banner_url,featured_url,large_image_url,attributes,create_tx_version,verified,items_total,owners_total,volume,listed,floor,slug,topoffer,royalty,sales_24h) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      const values = [
        collection.collection,
        collection.creator,
        collection.symbol,
        collection.description,
        collection.website,
        collection.email,
        collection.twitter,
        collection.discord,
        collection.telegram,
        collection.github,
        collection.instalgram,
        collection.medium,
        collection.logo_url,
        collection.banner_url,
        collection.featured_url,
        collection.large_image_url,
        JSON.stringify(collection.attributes),
        collection.create_tx_version,
        collection.verified,
        collection.items_total,
        collection.owners_total,
        0,
        0,
        0,
        collection.collection.replace(/[^A-Z0-9]+/gi, "-"),
        0,
        0,
        0,
      ];
      await con.query(query, values, (error: any, results: any) => {
        if (error) {
          console.error("Error inserting data:", error);
        } else {
        }
      });
    })
    .catch((error: any) => {
      // Handle errors
      console.error("Error:", error);
    });
};

export const getNFTByWallet = async (address: string) => {
  // just testing
  const operation = `
    query CurrentTokens($owner_address: String, $offset: Int, $limit: Int) {
      current_token_ownerships(
        where: {owner_address: {_eq: $owner_address}, amount: {_gt: "0"}, table_type: {_eq: "0x3::token::TokenStore"}}
        order_by: {last_transaction_version: desc}
        offset: $offset
      ) {
        name
        collection_name
        property_version
        creator_address
        amount
        owner_address
        current_token_data {
          metadata_uri
          description
          royalty_points_denominator
          royalty_points_numerator
          royalty_mutable
          default_properties
        }
        current_collection_data {
          collection_name
          description
          metadata_uri
          supply
        }
      }
    }
  `;
  const fetchCurrentTokens = (owner_address: string, offset: number) => {
    return fetchGraphQL(operation, "CurrentTokens", {
      owner_address: owner_address,
      offset: offset,
    });
  };

  const startFetchCurrentTokens = async (
    owner_address: string,
    offset: number
  ) => {
    const { error, data } = await fetchCurrentTokens(owner_address, offset);

    for (let i = 0; i < data.current_token_ownerships.length; i++) {
      let metadata_uri =
        data.current_token_ownerships[i].current_token_data.metadata_uri;
      let image_uri = "";
      const query =
        "INSERT INTO nftitem (collection,creator,name,asset_id,property_version,interact_function,minter,owner,mint_timestamp,mint_transaction_hash,mint_price,content_type,content_uri,token_uri,metadata,image_uri,external_link,latest_trade_price,latest_trade_timestamp,latest_trade_transaction_version,latest_trade_transaction_hash,isForSale,price,offer_id,slug) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

      const values = [
        data.current_token_ownerships[i].collection_name,
        data.current_token_ownerships[i].creator_address,
        data.current_token_ownerships[i].name,
        "",
        data.current_token_ownerships[i].property_version,
        "",
        "",
        data.current_token_ownerships[i].owner_address,
        "",
        "",
        0,
        "",
        image_uri,
        image_uri,
        "",
        image_uri,
        image_uri,
        0,
        "",
        "",
        "",
        0,
        0,
        0,
        data.current_token_ownerships[i].collection_name.replace(
          /[^A-Z0-9]+/gi,
          "-"
        ),
      ];

      if (
        metadata_uri.includes(".png") ||
        metadata_uri.includes(".jpeg") ||
        metadata_uri.includes(".jpg") ||
        metadata_uri.includes(".webp") ||
        metadata_uri.includes(".gif") ||
        metadata_uri.includes(".mp4") ||
        metadata_uri.includes("metadata.wav3.net") ||
        metadata_uri.includes("lime-worried-crawdad-244.mypinata.cloud")
      ) {
        image_uri = metadata_uri;
        values[12] = image_uri; // Update image_uri in values array
        values[13] = image_uri; // Update image_uri in values array
        values[15] = image_uri; // Update image_uri in values array
        values[16] = image_uri; // Update image_uri in values array
        values[14] = JSON.stringify([]); // Update metadata in values array
        if (
          metadata_uri.includes("metadata.wav3.net") ||
          metadata_uri.includes("lime-worried-crawdad-244.mypinata.cloud")
        )
          values[15] = "";

        await new Promise((resolve) => setTimeout(resolve, 10));

        const results: any = await executeQuery(
          con,
          "SELECT * from nftitem WHERE name = ?",
          [data.current_token_ownerships[i].name]
        );

        if (results.length === 0) {
          await executeQuery(con, query, values);
        } else if (
          results[0].owner !== data.current_token_ownerships[i].owner_address
        ) {
          await executeQuery(con, "UPDATE nftitem SET owner=? WHERE id = ?", [
            data.current_token_ownerships[i].owner_address,
            results[0].id,
          ]);
        }
      } else {
        metadata_uri = metadata_uri
          .replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
          .replace(
            "https://green-elegant-opossum-682.mypinata.cloud/ipfs/",
            "https://cloudflare-ipfs.com/ipfs/"
          )
          .replace(
            "https://ipfs.io/ipfs/",
            "https://cloudflare-ipfs.com/ipfs/"
          );

        try {
          await new Promise((resolve) => setTimeout(resolve, 10));
          const results: any = await executeQuery(
            con,
            "SELECT * from nftitem WHERE name = ?",
            [data.current_token_ownerships[i].name]
          );

          const response: any = await axios.get(metadata_uri);

          if (response !== undefined) {
            image_uri = response.data.image;
            values[12] = image_uri; // Update image_uri in values array
            values[13] = image_uri; // Update image_uri in values array
            values[15] = image_uri; // Update image_uri in values array
            values[16] = image_uri; // Update image_uri in values array

            values[14] = JSON.stringify(response.data.attributes); // Update metadata in values array
          }

          if (results.length === 0) {
            await executeQuery(con, query, values);
          } else if (
            results[0].owner !== data.current_token_ownerships[i].owner_address
          ) {
            await executeQuery(con, "UPDATE nftitem SET owner=? WHERE id = ?", [
              data.current_token_ownerships[i].owner_address,
              results[0].id,
            ]);
          }
        } catch (error: any) {
          continue;
        }
      }
    }

    if (error) {
      console.log(error);
    }
    return;
  };

  // end of testing
  // const apiUrl = `${process.env.MFTSCAN_API_ENDPOINT}apt/account/own/all/${address}`;
  // // uncommend after testing

  // await fetch(apiUrl, {
  //   method: "GET",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "X-API-KEY": process.env.NFTSCAN_API_KEY,
  //   },
  // })
  //   .then((response: { ok: any; status: any; json: () => any }) => {
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! Status: ${response.status}`);
  //     }
  //     return response.json();
  //   })
  //   .then(async (data: any) => {
  //     for (let i = 0; i < data.data.length; i++) {
  //       const content = data.data[i].assets[0];
  //       const find_query =
  //         "SELECT * FROM nftitem WHERE slug COLLATE utf8_general_ci = ?  AND creator COLLATE utf8_general_ci = ? AND asset_id COLLATE utf8_general_ci = ? ";
  //       const find_vales = [
  //         content.collection.replace(/[^A-Z0-9]+/gi, "-"),
  //         content.creator,
  //         content.asset_id,
  //       ];
  //       await con.query(
  //         find_query,
  //         find_vales,
  //         async (error: any, results: any) => {
  //           if (error) {
  //             console.error("Error inserting data:", error);
  //           } else {
  //             if (results.length === 0) {
  //               const query =
  //                 "INSERT INTO nftitem (collection,creator,name,asset_id,property_version,interact_function,minter,owner,mint_timestamp,mint_transaction_hash,mint_price,content_type,content_uri,token_uri,metadata,image_uri,external_link,latest_trade_price,latest_trade_timestamp,latest_trade_transaction_version,latest_trade_transaction_hash,isForSale,price,offer_id,slug) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
  //               // let metadata = JSON.parse(content.metadata_json);
  //               // let name = "";
  //               // if (metadata !== null) {
  //               //   name = metadata.name;
  //               // }

  //               const values = [
  //                 content.collection,
  //                 content.creator,
  //                 // name !== "" ? name : content.name, // Corrected reference to token_data_id_name
  //                 content.name,
  //                 content.asset_id,
  //                 content.property_version,
  //                 content.interact_function,
  //                 content.minter,
  //                 content.owner,
  //                 content.mint_timestamp,
  //                 content.mint_transaction_hash,
  //                 content.mint_price,
  //                 content.content_type,
  //                 content.content_uri,
  //                 content.token_uri,
  //                 content.metadata_json,
  //                 content.image_uri,
  //                 content.external_link,
  //                 content.latest_trade_price,
  //                 content.latest_trade_timestamp,
  //                 content.latest_trade_transaction_version,
  //                 content.latest_trade_transaction_hash,
  //                 0,
  //                 0,
  //                 0,
  //                 content.collection.replace(/[^A-Z0-9]+/gi, "-"),
  //               ];

  //               await executeQuery(con, query, values);
  //             } else {
  //               if (
  //                 results[0].owner !== content.owner ||
  //                 results[0].name !== content.name
  //               ) {
  //                 await executeQuery(
  //                   con,
  //                   "UPDATE nftitem SET owner=?, name = ? WHERE id = ?",
  //                   [content.owner, content.name, results[0].id]
  //                 );
  //               } else {
  //               }
  //             }
  //           }
  //         }
  //       );
  //     }
  //   })
  //   .catch((error: any) => {
  //     // Handle errors
  //     console.error("Error:", error);
  //   });

  await startFetchCurrentTokens(address, 0);
  return;
};
