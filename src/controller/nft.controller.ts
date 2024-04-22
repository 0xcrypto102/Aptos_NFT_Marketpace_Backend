import { aptosClient, tokenClient, MARKET_ADDRESS } from "../config/constants";
import axios from "axios";
import { I_TOKEN_ID_DATA, I_TOKEN_SLUG } from "../types/interfaces";
import { nftItem } from "../db/schema/nftItem";
import { collectionItem } from "../db/schema/collectionItem";
import { arrayFormat, fetchGraphQL, fetchListEvent } from "../utils/graphql";
import { delay } from "../utils/delay";
import { convertURL } from "../utils/graphql";
import { uploadImage } from "../utils/cloudinary";
import { getNFTByWallet } from "../utils/nftscan";
import con from "../db/dbConfig";
import { error } from "console";
import { exec } from "child_process";
import { executionAsyncId } from "async_hooks";
const util = require("util");

const fetch = require("node-fetch");

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

export const fetchListToken = async () => {
  try {
    const query = "SELECT * FROM nftitem WHERE isForSale = 1"; // Assuming 'nftItems' is the name of your MySQL table
    const [results] = await con.query(query);
    return results;
  } catch (error) {
    console.error("Error executing MySQL query: " + error);
    throw error;
  } finally {
    con.release();
  }
};
let page: any = 0;
export const collectedNft = async (
  address: string,
  slug: string | undefined,
  _page: number,
  _pageSize: number
) => {
  // if (_page != page) {

  try {
    const user: any = await executeQuery(
      con,
      "SELECT address from  profileitem Where address = ?",
      [address]
    );
    if (user.length === 0) {
      await getNFTByWallet(address);
    } else {
      getNFTByWallet(address);
    }

    // const query = `
    //     SELECT *
    //     FROM nftitem
    //     WHERE owner = ?
    //     LIMIT ?, ?
    //   `;
    // const values = [address, page * _pageSize, _pageSize];
    const query = "SELECT * FROM nftitem WHERE owner = ?";

    const values = [address];
    const result = await executeQuery(con, query, values);
    const countQuery = `
        SELECT COUNT(*) AS count
        FROM nftitem
        WHERE owner = ?
      `;
    const countValues = [address];

    const countResult: any = await executeQuery(con, countQuery, countValues);

    if (countResult.length === 0 || !result) return;

    const count = countResult[0].count;
    // page = _page;
    return { items: result, count: count };
  } catch (error) {
    throw error;
  }
  // }
  // } else {
  //   const operation = `
  //   query CurrentTokens($owner_address: String, $offset: Int) {
  //     current_token_ownerships(
  //       where: {owner_address: {_eq: $owner_address}, amount: {_gt: "0"}, table_type: {_eq: "0x3::token::TokenStore"}}
  //       order_by: {last_transaction_version: desc}
  //       offset: $offset
  //     ) {
  //       name
  //       collection_name
  //       property_version
  //       creator_address
  //       amount
  //       owner_address
  //       current_token_data {
  //         metadata_uri
  //         description
  //         royalty_points_denominator
  //         royalty_points_numerator
  //         royalty_mutable
  //         default_properties
  //       }
  //       current_collection_data {
  //         collection_name
  //         description
  //         metadata_uri
  //         supply
  //       }
  //     }
  //   }
  // `;

  //   const fetchCurrentTokens = (owner_address: string, offset: number) => {
  //     return fetchGraphQL(operation, "CurrentTokens", {
  //       owner_address: owner_address,
  //       offset: offset,
  //     });
  //   };
  //   const startFetchCurrentTokens = async (
  //     owner_address: string,
  //     offset: number
  //   ) => {
  //     const { errors, data } = await fetchCurrentTokens(owner_address, offset);
  //     if (errors) {
  //       console.error(errors);
  //     }
  //     const newNfts = await Promise.all(
  //       data.current_token_ownerships.map(async (token: any, i: number) => {
  //         const item = await con.query(
  //           `
  //           SELECT *
  //           FROM nftitem
  //           WHERE
  //             property_version = ? AND
  //             token_data_id.collection = ? AND
  //             token_data_id.creator = ? AND
  //             token_data_id.name = ?
  //           LIMIT 1
  //         `,
  //           [
  //             token.property_version,
  //             token.collection_name,
  //             token.creator_address,
  //             token.name,
  //           ]
  //         );

  //         if (!item) {
  //           return token;
  //         }
  //       })
  //     );
  //     const sortedNewNfts = newNfts.filter((item) => item);
  //     // uncomment this after run the project

  //     // if (sortedNewNfts.length > 0) {
  //     //   await Promise.all(
  //     //     sortedNewNfts?.map(async (token: any, i: number) => {
  //     //       let imageUri: string;
  //     //       let _metaData: any[] = [];
  //     //       let _metadata_uri =
  //     //         token.current_token_data.metadata_uri?.slice(-5);
  //     //       if (
  //     //         _metadata_uri.includes(".png") ||
  //     //         _metadata_uri.includes(".jpeg") ||
  //     //         _metadata_uri.includes(".jpg") ||
  //     //         _metadata_uri.includes(".webp") ||
  //     //         _metadata_uri.includes(".gif")
  //     //       ) {
  //     //         imageUri = token.current_token_data.metadata_uri
  //     //           .replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
  //     //           .replace(
  //     //             "https://green-elegant-opossum-682.mypinata.cloud/ipfs/",
  //     //             "https://cloudflare-ipfs.com/ipfs/"
  //     //           )
  //     //           .replace(
  //     //             "https://ipfs.io/ipfs/",
  //     //             "https://cloudflare-ipfs.com/ipfs/"
  //     //           );
  //     //         const fixedArray = Object.entries(
  //     //           token?.current_token_data?.default_properties
  //     //         ).map(([trait_type, value]): [string, string] => [
  //     //           trait_type,
  //     //           value as string,
  //     //         ]);

  //     //         _metaData = fixedArray.map(function ([trait_type, value]: [
  //     //           string,
  //     //           string
  //     //         ]) {
  //     //           const val = Buffer.from(value.slice(2), "hex").toString();
  //     //           return { trait_type, value: val };
  //     //         });
  //     //       } else {
  //     //         if (token.current_token_data.metadata_uri?.length > 0) {
  //     //           try {
  //     //             const str = `{"method":"GET","uri": "${token.current_token_data.metadata_uri
  //     //               .replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
  //     //               .replace(
  //     //                 "https://green-elegant-opossum-682.mypinata.cloud/ipfs/",
  //     //                 "https://cloudflare-ipfs.com/ipfs/"
  //     //               )
  //     //               .replace(
  //     //                 "https://ipfs.io/ipfs/",
  //     //                 "https://cloudflare-ipfs.com/ipfs/"
  //     //               )}","headers":{},"auth":{"_t":"None"}}`;
  //     //             const buffer = Buffer.from(str);
  //     //             const base64 = buffer.toString("base64");

  //     //             const result = await fetch("https://restninja.io/in/proxy", {
  //     //               headers: {
  //     //                 accept: "*/*",
  //     //                 "accept-language": "en-US,en;q=0.9",
  //     //                 request: base64,
  //     //                 "sec-ch-ua":
  //     //                   '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
  //     //                 "sec-ch-ua-mobile": "?0",
  //     //                 "sec-ch-ua-platform": '"Windows"',
  //     //                 "sec-fetch-dest": "empty",
  //     //                 "sec-fetch-mode": "cors",
  //     //                 "sec-fetch-site": "same-origin",
  //     //                 cookie:
  //     //                   "_gid=GA1.2.504598292.1683143371; twk_idm_key=iBr3OE0hO0X27d6GpPBRG; sc_is_visitor_unique=rx12865986.1683143462.D63B037B39CA4F220058691E0234DE36.1.1.1.1.1.1.1.1.1; _gat_gtag_UA_2652919_3=1; _ga_JQXWSK7VEK=GS1.1.1683143370.1.1.1683143461.0.0.0; _ga=GA1.1.1030511354.1683143371; TawkConnectionTime=0; twk_uuid_5ae071e9227d3d7edc24b9dc=%7B%22uuid%22%3A%221.SwoXUkJcFEhb6z7ddQwy6V3WPjWccTAuWMmxyc3f2kJzjxMY6u1v8LOAHWcbqOFjq1smhV2S60R3j5aBqlz0T5KuXPXYmLRjNXvregFLXGPzGshnNmcV2%22%2C%22version%22%3A3%2C%22domain%22%3A%22restninja.io%22%2C%22ts%22%3A1683143463669%7D",
  //     //                 Referer: "https://restninja.io/",
  //     //                 "Referrer-Policy": "strict-origin-when-cross-origin",
  //     //               },
  //     //               body: null,
  //     //               method: "POST",
  //     //             });

  //     //             let test = await result.json();

  //     //             //In this case, URL is json
  //     //             if (typeof test == "object") {
  //     //               imageUri = test?.image
  //     //                 ?.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
  //     //                 .replace(
  //     //                   "https://green-elegant-opossum-682.mypinata.cloud/ipfs/",
  //     //                   "https://cloudflare-ipfs.com/ipfs/"
  //     //                 )
  //     //                 .replace(
  //     //                   "https://ipfs.io/ipfs/",
  //     //                   "https://cloudflare-ipfs.com/ipfs/"
  //     //                 );
  //     //               if (test?.attributes?.length > 0) {
  //     //                 _metaData = test?.attributes;
  //     //               } else {
  //     //                 const fixedArray = Object.entries(
  //     //                   token?.current_token_data?.default_properties
  //     //                 ).map(([trait_type, value]): [string, string] => [
  //     //                   trait_type,
  //     //                   value as string,
  //     //                 ]);

  //     //                 _metaData = fixedArray.map(function ([
  //     //                   trait_type,
  //     //                   value,
  //     //                 ]: [string, string]) {
  //     //                   const val = Buffer.from(
  //     //                     value.slice(2),
  //     //                     "hex"
  //     //                   ).toString();
  //     //                   return { trait_type, value: val };
  //     //                 });
  //     //               }
  //     //             }
  //     //           } catch (error: any) {
  //     //             if (error.type == "invalid-json") {
  //     //               imageUri = token.current_token_data.metadata_uri
  //     //                 ?.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
  //     //                 .replace(
  //     //                   "https://green-elegant-opossum-682.mypinata.cloud/ipfs/",
  //     //                   "https://cloudflare-ipfs.com/ipfs/"
  //     //                 )
  //     //                 .replace(
  //     //                   "https://ipfs.io/ipfs/",
  //     //                   "https://cloudflare-ipfs.com/ipfs/"
  //     //                 );
  //     //               const fixedArray = Object.entries(
  //     //                 token?.current_token_data?.default_properties
  //     //               ).map(([trait_type, value]): [string, string] => [
  //     //                 trait_type,
  //     //                 value as string,
  //     //               ]);

  //     //               _metaData = fixedArray.map(function ([trait_type, value]: [
  //     //                 string,
  //     //                 string
  //     //               ]) {
  //     //                 const val = Buffer.from(value.slice(2), "hex").toString();
  //     //                 return { trait_type, value: val };
  //     //               });
  //     //             }
  //     //           }
  //     //         }
  //     //       }
  //     //       let nftItem = await con.query("INSERT INTO nftitem (property_version,collection,creator,name,image_uri,description,isForSale,metadata,owner,slug,token_uri,collection_name,collection_description,collection_metadata_uri) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", [
  //     //         token.property_version,
  //     //         token.collection_name,
  //     //         token.creator_address,
  //     //         token.name,
  //     //         await uploadImage(imageUri!),
  //     //         token.current_token_data.description,
  //     //         false,
  //     //         token.owner_address,
  //     //         `${token.collection_name?.replace(
  //     //           /[^A-Z0-9]+/gi,
  //     //           "-"
  //     //         )}-${token.creator_address.substring(61)}`,
  //     //         token.current_token_data.metadata_uri
  //     //         .replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
  //     //         .replace(
  //     //           "https://green-elegant-opossum-682.mypinata.cloud/ipfs/",
  //     //           "https://cloudflare-ipfs.com/ipfs/"
  //     //         )
  //     //         .replace(
  //     //           "https://ipfs.io/ipfs/",
  //     //           "https://cloudflare-ipfs.com/ipfs/"
  //     //         ),
  //     //         token.current_collection_data.collection_name,
  //     //         token.current_collection_data.description,
  //     //         token.current_collection_data.metadata_uri
  //     //         .replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
  //     //         .replace(
  //     //           "https://green-elegant-opossum-682.mypinata.cloud/ipfs/",
  //     //           "https://cloudflare-ipfs.com/ipfs/"
  //     //         )
  //     //         .replace(
  //     //           "https://ipfs.io/ipfs/",
  //     //           "https://cloudflare-ipfs.com/ipfs/"
  //     //         )
  //     //       ])
  //     //       /******/
  //     //       let _collectionItem = await con.query('SELECT * FROM collectionitem WHERE collection_name = ? VALUES (?)', [token.collection_name]);

  //     //       let _royalty =
  //     //         token.current_token_data.royalty_points_numerator /
  //     //         token.current_token_data.royalty_points_denominator;
  //     //       const imageUrlRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;

  //     //       function isImageUrl(url: string) {
  //     //         return imageUrlRegex.test(url);
  //     //       }

  //     //       if (_collectionItem == null) {
  //     //         const collectionItemSql = `
  //     //           INSERT INTO collectionItem (property_version, collection, creator, name, supply, owner, slug, description, royalty, metadata_uri, image_uri)
  //     //           VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?);
  //     //         `;
  //     //         const collectionItemValues = [
  //     //           token.property_version,
  //     //           token.collection_name,
  //     //           token.creator_address,
  //     //           token.current_collection_data.supply,
  //     //           itemAmount.length, // Assuming itemAmount is defined earlier
  //     //           `${token.collection_name.replace(/[^A-Z0-9]+/gi, "-")}-${token.creator_address.substring(61)}`,
  //     //           token.current_collection_data.description,
  //     //           isNaN(_royalty) ? 0 : _royalty,
  //     //           token.current_collection_data.metadata_uri
  //     //             .replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
  //     //             .replace("https://green-elegant-opossum-682.mypinata.cloud/ipfs/", "https://cloudflare-ipfs.com/ipfs/")
  //     //             .replace("https://ipfs.io/ipfs/", "https://cloudflare-ipfs.com/ipfs/"),
  //     //           image_uri, // Set this value
  //     //         ];
  //     //         let collecteditem = await collectionItem.create({
  //     //           key: {
  //     //             property_version: token.property_version,
  //     //             token_data_id: {
  //     //               collection: token.collection_name,
  //     //               creator: token.creator_address,
  //     //               name: "",
  //     //             },
  //     //           },
  //     //         });
  //     //         collecteditem.supply = token.current_collection_data.supply;
  //     //         let itemAmount = await nftItem
  //     //           .find({
  //     //             "key.token_data_id.collection": token.collection_name,
  //     //           })
  //     //           .distinct("owner")
  //     //           .exec();
  //     //         if (!itemAmount) return;
  //     //         collecteditem.owner = itemAmount.length;
  //     //         collecteditem.slug = `${token.collection_name?.replace(
  //     //           /[^A-Z0-9]+/gi,
  //     //           "-"
  //     //         )}-${token.creator_address.substring(61)}`;

  //     //         collecteditem.name =
  //     //           token.current_collection_data.collection_name;
  //     //         collecteditem.description =
  //     //           token.current_collection_data.description;
  //     //         collecteditem.royalty = isNaN(_royalty) ? 0 : _royalty;
  //     //         collecteditem.metadata_uri =
  //     //           token.current_collection_data.metadata_uri
  //     //             .replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
  //     //             .replace(
  //     //               "https://green-elegant-opossum-682.mypinata.cloud/ipfs/",
  //     //               "https://cloudflare-ipfs.com/ipfs/"
  //     //             )
  //     //             .replace(
  //     //               "https://ipfs.io/ipfs/",
  //     //               "https://cloudflare-ipfs.com/ipfs/"
  //     //             );
  //     //         let image_uri: string;
  //     //         if (
  //     //           isImageUrl(
  //     //             convertURL(
  //     //               token.current_collection_data.metadata_uri
  //     //             ).replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
  //     //           )
  //     //         ) {
  //     //           try {
  //     //             image_uri = convertURL(
  //     //               token.current_collection_data.metadata_uri.replace(
  //     //                 "ipfs://",
  //     //                 "https://cloudflare-ipfs.com/ipfs/"
  //     //               )
  //     //             );
  //     //           } catch (error) {
  //     //             console.log(error);
  //     //           }
  //     //         } else {
  //     //           let test: any;
  //     //           try {
  //     //             const str = `{"method":"GET","uri": "${convertURL(
  //     //               token.current_collection_data.metadata_uri.replace(
  //     //                 "ipfs://",
  //     //                 "https://cloudflare-ipfs.com/ipfs/"
  //     //               )
  //     //             )}","headers":{},"auth":{"_t":"None"}}`;
  //     //             const buffer = Buffer.from(str);
  //     //             const base64 = buffer.toString("base64");

  //     //             const result = await fetch("https://restninja.io/in/proxy", {
  //     //               headers: {
  //     //                 accept: "*/*",
  //     //                 "accept-language": "en-US,en;q=0.9",
  //     //                 request: base64,
  //     //                 "sec-ch-ua":
  //     //                   '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
  //     //                 "sec-ch-ua-mobile": "?0",
  //     //                 "sec-ch-ua-platform": '"Windows"',
  //     //                 "sec-fetch-dest": "empty",
  //     //                 "sec-fetch-mode": "cors",
  //     //                 "sec-fetch-site": "same-origin",
  //     //                 cookie:
  //     //                   "_gid=GA1.2.504598292.1683143371; twk_idm_key=iBr3OE0hO0X27d6GpPBRG; sc_is_visitor_unique=rx12865986.1683143462.D63B037B39CA4F220058691E0234DE36.1.1.1.1.1.1.1.1.1; _gat_gtag_UA_2652919_3=1; _ga_JQXWSK7VEK=GS1.1.1683143370.1.1.1683143461.0.0.0; _ga=GA1.1.1030511354.1683143371; TawkConnectionTime=0; twk_uuid_5ae071e9227d3d7edc24b9dc=%7B%22uuid%22%3A%221.SwoXUkJcFEhb6z7ddQwy6V3WPjWccTAuWMmxyc3f2kJzjxMY6u1v8LOAHWcbqOFjq1smhV2S60R3j5aBqlz0T5KuXPXYmLRjNXvregFLXGPzGshnNmcV2%22%2C%22version%22%3A3%2C%22domain%22%3A%22restninja.io%22%2C%22ts%22%3A1683143463669%7D",
  //     //                 Referer: "https://restninja.io/",
  //     //                 "Referrer-Policy": "strict-origin-when-cross-origin",
  //     //               },
  //     //               body: null,
  //     //               method: "POST",
  //     //             });

  //     //             test = await result.json();
  //     //           } catch (error: any) {
  //     //             if (error.type == "invalid-json") {
  //     //               image_uri = convertURL(
  //     //                 token.current_collection_data.metadata_uri.replace(
  //     //                   "ipfs://",
  //     //                   "https://cloudflare-ipfs.com/ipfs/"
  //     //                 )
  //     //               );
  //     //             }
  //     //           }

  //     //           if (typeof test == "object") {
  //     //             image_uri = convertURL(
  //     //               test?.image.replace(
  //     //                 "ipfs://",
  //     //                 "https://cloudflare-ipfs.com/ipfs/"
  //     //               )
  //     //             );
  //     //           }
  //     //         }
  //     //         collecteditem.image_uri = await uploadImage(image_uri!);
  //     //         await collecteditem.save();
  //     //         /******/
  //     //       } else {
  //     //         _collectionItem.supply = token.current_collection_data.supply;
  //     //         _collectionItem.royalty = isNaN(_royalty) ? 0 : _royalty;

  //     //         let itemAmount = await nftItem
  //     //           .find({
  //     //             "key.token_data_id.collection": token.collection_name,
  //     //           })
  //     //           .distinct("owner")
  //     //           .exec();
  //     //         if (!itemAmount) return;
  //     //         _collectionItem.owner = itemAmount.length;
  //     //         _collectionItem.slug = `${token.collection_name?.replace(
  //     //           /[^A-Z0-9]+/gi,
  //     //           "-"
  //     //         )}-${token.creator_address.substring(61)}`;

  //     //         _collectionItem.name =
  //     //           token.current_collection_data.collection_name;
  //     //         _collectionItem.description =
  //     //           token.current_collection_data.description;
  //     //         _collectionItem.metadata_uri =
  //     //           token.current_collection_data.metadata_uri
  //     //             .replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
  //     //             .replace(
  //     //               "https://green-elegant-opossum-682.mypinata.cloud/ipfs/",
  //     //               "https://cloudflare-ipfs.com/ipfs/"
  //     //             )
  //     //             .replace(
  //     //               "https://ipfs.io/ipfs/",
  //     //               "https://cloudflare-ipfs.com/ipfs/"
  //     //             );
  //     //         let _image_uri: string;
  //     //         if (
  //     //           isImageUrl(
  //     //             convertURL(
  //     //               token.current_collection_data.metadata_uri.replace(
  //     //                 "ipfs://",
  //     //                 "https://cloudflare-ipfs.com/ipfs/"
  //     //               )
  //     //             )
  //     //           )
  //     //         ) {
  //     //           _image_uri = convertURL(
  //     //             token.current_collection_data.metadata_uri.replace(
  //     //               "ipfs://",
  //     //               "https://cloudflare-ipfs.com/ipfs/"
  //     //             )
  //     //           );
  //     //         } else {
  //     //           let test: any;
  //     //           try {
  //     //             const str = `{"method":"GET","uri": "${convertURL(
  //     //               token.current_collection_data.metadata_uri.replace(
  //     //                 "ipfs://",
  //     //                 "https://cloudflare-ipfs.com/ipfs/"
  //     //               )
  //     //             )}","headers":{},"auth":{"_t":"None"}}`;
  //     //             const buffer = Buffer.from(str);
  //     //             const base64 = buffer.toString("base64");

  //     //             const result = await fetch("https://restninja.io/in/proxy", {
  //     //               headers: {
  //     //                 accept: "*/*",
  //     //                 "accept-language": "en-US,en;q=0.9",
  //     //                 request: base64,
  //     //                 "sec-ch-ua":
  //     //                   '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
  //     //                 "sec-ch-ua-mobile": "?0",
  //     //                 "sec-ch-ua-platform": '"Windows"',
  //     //                 "sec-fetch-dest": "empty",
  //     //                 "sec-fetch-mode": "cors",
  //     //                 "sec-fetch-site": "same-origin",
  //     //                 cookie:
  //     //                   "_gid=GA1.2.504598292.1683143371; twk_idm_key=iBr3OE0hO0X27d6GpPBRG; sc_is_visitor_unique=rx12865986.1683143462.D63B037B39CA4F220058691E0234DE36.1.1.1.1.1.1.1.1.1; _gat_gtag_UA_2652919_3=1; _ga_JQXWSK7VEK=GS1.1.1683143370.1.1.1683143461.0.0.0; _ga=GA1.1.1030511354.1683143371; TawkConnectionTime=0; twk_uuid_5ae071e9227d3d7edc24b9dc=%7B%22uuid%22%3A%221.SwoXUkJcFEhb6z7ddQwy6V3WPjWccTAuWMmxyc3f2kJzjxMY6u1v8LOAHWcbqOFjq1smhV2S60R3j5aBqlz0T5KuXPXYmLRjNXvregFLXGPzGshnNmcV2%22%2C%22version%22%3A3%2C%22domain%22%3A%22restninja.io%22%2C%22ts%22%3A1683143463669%7D",
  //     //                 Referer: "https://restninja.io/",
  //     //                 "Referrer-Policy": "strict-origin-when-cross-origin",
  //     //               },
  //     //               body: null,
  //     //               method: "POST",
  //     //             });

  //     //             test = await result.json();
  //     //           } catch (error: any) {
  //     //             console.log(error);
  //     //             if (error.type == "invalid-json") {
  //     //               _image_uri = convertURL(
  //     //                 token.current_collection_data.metadata_uri.replace(
  //     //                   "ipfs://",
  //     //                   "https://cloudflare-ipfs.com/ipfs/"
  //     //                 )
  //     //               );
  //     //             }
  //     //           }
  //     //           if (typeof test == "object") {
  //     //             _image_uri = convertURL(
  //     //               test?.image.replace(
  //     //                 "ipfs://",
  //     //                 "https://cloudflare-ipfs.com/ipfs/"
  //     //               )
  //     //             );
  //     //           }
  //     //         }
  //     //         _collectionItem.image_uri = await uploadImage(_image_uri!);
  //     //         await _collectionItem.save();
  //     //         /******/
  //     //       }
  //     //     })
  //     //   );
  //     // }
  //   };

  //   // await startFetchCurrentTokens(address, 0);

  //   // let query: any = {
  //   //   owner: address,
  //   // };

  //   // if (slug) {
  //   //   query.slug = slug;
  //   // }

  //   // const result = await nftItem
  //   //   .aggregate([
  //   //     {
  //   //       $lookup: {
  //   //         from: "collectionitems", //other table name
  //   //         localField: "slug", //name of car table field
  //   //         foreignField: "slug", //name of cardetails table field
  //   //         as: "collection", //alias for cardetails table
  //   //       },
  //   //     },
  //   //     {
  //   //       $match: query,
  //   //     },
  //   //     {
  //   //       $project: {
  //   //         image_uri: 1,
  //   //         "key.token_data_id.name": 1,
  //   //         collection_name: 1,
  //   //         price: 1,
  //   //         slug: 1,
  //   //         "collection.topoffer": 1,
  //   //         "collection.floor": 1,
  //   //       },
  //   //     },
  //   //   ])
  //   //   .skip(_page * _pageSize)
  //   //   .limit(_pageSize)
  //   //   .exec();

  //   // let count = await nftItem
  //   //   .find({
  //   //     owner: address,
  //   //   })
  //   //   .count()
  //   //   .lean()
  //   //   .exec();

  //   // if (!result) return;

  //   // return { items: result, count: count };
  // }
};

export const collection = async (
  slug: string,
  _isForSale: any,
  _filter: string,
  _page: string,
  _pageSize: string
) => {
  try {
    // let query = 'SELECT * FROM nftitem JOIN collectionitem ON nftitem.collection_data_id_hash = collectionitem.collection_data_id_hash WHERE nftitem.slug = ?';
    let query = "SELECT * FROM nftitem  WHERE slug = ?";
    let queryParams: (string | number)[] = [slug];

    if (_isForSale === "true") {
      query += " AND isForSale = 1";
    }

    if (_filter !== undefined && JSON.parse(_filter).length > 0) {
      const filterConditions = JSON.parse(_filter).map(
        (filter: { trait_type: string; value: string }) => {
          // Use JSON_CONTAINS function for MariaDB
          return "JSON_EXTRACT(metadata,'$.attributes[?].trait_type') = ?  AND JSON_EXTRACT(metadata, '$.attributes[?].value') = ?";
        }
      );

      query += ` AND (${filterConditions.join(" OR ")})`;

      const filterParams = JSON.parse(_filter).flatMap(
        (filter: { trait_type: string; value: string; index: number }) => [
          filter.index,
          filter.trait_type,
          filter.index,
          filter.value,
        ]
      );
      queryParams.push(...filterParams);
    }

    const _query =
      query + " ORDER BY isForSale DESC, price ASC LIMIT  ? OFFSET  ?";
    queryParams.push(parseInt(_pageSize) as number);
    queryParams.push((parseInt(_pageSize) * (parseInt(_page) - 1)) as number);

    return new Promise((resolve, reject) => {
      try {
        con.query(
          _query,
          queryParams,
          (error: any, results: any, fields: any) => {
            if (error) {
              reject(error);
            } else {
              const rows = results;
              let countQuery = query.replace(
                "SELECT *",
                "SELECT COUNT(*) as count"
              );
              con.query(
                countQuery,
                queryParams,
                (error: any, countResults: any, fields: any) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve({ count: countResults[0].count, items: rows });
                  }
                }
              );
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error("Error fetching data from MySQL:", error);
    return { count: 0, items: [] };
  }
};

export const updateListToken = async (token: any) => {
  const listEvents = await aptosClient.getEventsByEventHandle(
    MARKET_ADDRESS!,
    `${MARKET_ADDRESS}::marketplace::MarketEvents`,
    "list_token_events"
  );
  let _token_id = {
    collection: token[3],
    creator: token[2],
    name: token[4],
  };
  listEvents.sort((a, b) => a.data.timestamp - b.data.timestamp);

  const result = listEvents.find(({ data }) => {
    return (
      data.token_id.token_data_id.collection === token[3] &&
      data.token_id.token_data_id.creator === token[2] &&
      data.token_id.token_data_id.name === token[4]
    );
  });
};

export const handleNft = async (tokenIdData: I_TOKEN_SLUG) => {
  try {
    // const query = `
    //   SELECT ni.*, ci.*, pi.*
    //   FROM nftitem ni
    //   LEFT JOIN collectionitem ci ON ni.slug = ci.slug
    //   LEFT JOIN profileitem pi ON ni.owner = pi.address
    //   WHERE
    //     ni.property_version = ?
    //     AND ni.name = ?
    //     AND ni.slug = ?
    // `;
    const query = `
      SELECT ni.*, ci.* , pi.name AS user_name
      FROM nftitem ni
      LEFT JOIN collectionitem ci ON ni.slug = ci.slug
      LEFT JOIN profileitem pi ON pi.address = ni.owner
      WHERE
        ni.property_version = ?
        AND ni.name = ?
        AND ni.slug = ?
    `;
    const values = [
      tokenIdData.property_version,
      tokenIdData.name,
      tokenIdData.slug,
    ];

    const result = await executeQuery(con, query, values);
    return result;
  } catch (error) {
    throw error;
  }
};

export const handleCollectionNft = async (tokenIdData: I_TOKEN_SLUG) => {
  try {
    let sql;
    const sqlParams = [tokenIdData.property_version, tokenIdData.slug];
    if (tokenIdData.name && tokenIdData.name.length > 0) {
      sql = `
        SELECT *
        FROM nftitem
        WHERE
          property_version = ?
          AND name = ?
          AND slug = ?
      `;
      sqlParams.splice(1, 0, tokenIdData.name);
    } else {
      sql = `
        SELECT *
        FROM nftitem
        WHERE
          property_version = ?
          slug = ?
      `;
    }

    const rows: any = await executeQuery(con, sql, sqlParams);

    if (rows.length === 0) {
      return null; // Handle case when no data is found
    }

    // Process the result (rows) here
    const item = rows[0];

    return item;
  } catch (error) {
    throw error;
  }
};

export const handleNfts = async (tokenIdData: I_TOKEN_ID_DATA) => {
  try {
    const [rows] = await con.query("SELECT * FROM nftitem");
    // Process the result (rows) here
    return rows;
  } catch (error) {
    throw error;
  }
};

export const handleMintRequest = async (tokenIdData: I_TOKEN_ID_DATA) => {
  try {
    // Retrieve token data using your 'tokenClient.getTokenData' method
    const token = await tokenClient.getTokenData(
      tokenIdData.creator,
      tokenIdData.collection,
      tokenIdData.name
    );

    if (!token) return null;

    // Create a new item in the 'nft_item' table
    await con.query(
      "INSERT INTO nftitem (property_version, collection, creator, name, image_uri, description, isForSale, owner) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
        token.uri, // Assuming 'token.uri' is the image_uri
        token.description,
        tokenIdData.creator, // Assuming 'owner' is the creator
      ]
    );

    // Retrieve the newly inserted item
    const [rows] = await con.query(
      "SELECT * FROM nftitem WHERE property_version = ? AND collection = ? AND creator = ? AND name = ?",
      [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
      ]
    );

    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  } catch (error) {
    throw error;
  }
};

export const handleListingRequest = async (tokenIdData: I_TOKEN_ID_DATA) => {
  async function startFetchListEvent(
    account_address: string,
    type: string,
    offset: number
  ) {
    try {
      // uncomment this after solve graphql error;
      const { errors, data } = await fetchListEvent(
        account_address,
        type,
        offset
      );

      if (errors) {
        console.error(errors);
      }
      // Find the item in the 'nft_item' table
      let query =
        "SELECT * FROM nftitem WHERE property_version = ? AND collection = ? AND creator = ? AND name = ?";
      let values = [
        tokenIdData.property_version,
        tokenIdData.collection,
        tokenIdData.creator,
        tokenIdData.name,
      ];

      const results: any = await executeQuery(con, query, values);

      if (results.length === 0) {
        return null;
      }

      let item = results[0];
      if (!item) return;

      const token = data.events[0];
      // Update the 'nft_item' table
      query =
        "UPDATE nftitem SET price = ?, offer_id = ?, isForSale = 1 WHERE id = ?";
      values = [
        token.data.price, // Assuming 'token.data.price' contains the price
        token.data.offer_id, // Assuming 'token.data.offer_id' contains the offer_id
        item.id,
      ];
      await executeQuery(con, query, values);
      item.price = token.data.price;
      item.offer_id = token.data.offer_id;
      item.isForSale = 1;
      // Fetch listed items
      const listedItems: any = await executeQuery(
        con,
        "SELECT * FROM nftitem WHERE collection = ? AND isForSale = 1 ORDER BY price ASC",
        [tokenIdData.collection]
      );

      // Find or insert the collection item in the 'collection_item' table
      const collectionRows: any = await executeQuery(
        con,
        "SELECT * FROM collectionitem WHERE collection = ? AND creator = ?",
        [tokenIdData.collection, tokenIdData.creator]
      );

      if (collectionRows.length === 0) {
        await executeQuery(
          con,
          "INSERT INTO collectionitem (collection, creator, listed, floor) VALUES (?, ?, ?, ?, ?)",
          [
            tokenIdData.collection,
            tokenIdData.creator,
            listedItems.length,
            listedItems.length > 0 ? listedItems[0].price : null,
          ]
        );
      } else {
        await executeQuery(
          con,
          "UPDATE collectionitem SET listed = ?, floor = ? WHERE id = ?",
          [
            listedItems.length,
            listedItems.length > 0 ? listedItems[0].price : null,
            collectionRows[0].id,
          ]
        );
      }
      return item;
    } catch (error) {
      throw error;
    }
  }

  let item = startFetchListEvent(
    MARKET_ADDRESS!,
    `${MARKET_ADDRESS}::marketplace::ListTokenEvent`,
    0
  );
  return item;
};

export const handleBuyRequest = async (tokenIdData: I_TOKEN_ID_DATA) => {
  async function startFetchListEvent(
    account_address: string,
    type: string,
    offset: number
  ) {
    try {
      const { errors, data } = await fetchListEvent(
        account_address,
        type,
        offset
      );
      if (errors) {
        console.error(errors);
      }
      // Find the item in the 'nft_item' table
      const results: any = await executeQuery(
        con,
        "SELECT * FROM nftitem WHERE property_version = ? AND collection = ? AND creator = ? AND name = ?",
        [
          tokenIdData.property_version,
          tokenIdData.collection,
          tokenIdData.creator,
          tokenIdData.name,
        ]
      );

      if (results.length === 0) {
        return null;
      }

      const item = results[0];
      if (!item) return;
      const token = data.events[0];
      // Update the 'nft_item' table
      await executeQuery(
        con,
        "UPDATE nftitem SET latest_trade_price = ?,price = ?, offer_id = ?, isForSale = 0, owner = ? WHERE id = ?",
        [
          data.events[0].data.price,
          0, // Assuming you set price and offer_id to 0
          0,
          `0x${token.data.buyer.substring(2).padStart(64, "0")}`, // Convert buyer address
          item.id,
        ]
      );
      item.price = 0;
      item.offer_id = 0;
      item.isForSale = 0;
      item.owner = `0x${token.data.buyer.substring(2).padStart(64, "0")}`;

      // Fetch listed items
      const listedItems: any = await executeQuery(
        con,
        "SELECT * FROM nftitem WHERE collection = ? AND isForSale = 1 ORDER BY price ASC",
        [tokenIdData.collection]
      );

      // Find or insert the collection item in the 'collection_item' table
      const collectionRows: any = await executeQuery(
        con,
        // "SELECT * FROM collectionitem WHERE property_version = ? AND collection = ? AND creator = ?",
        "SELECT * FROM collectionitem WHERE  collection = ? AND creator = ?",

        [
          // tokenIdData.property_version,
          tokenIdData.collection,
          tokenIdData.creator,
        ]
      );

      if (collectionRows.length === 0) {
        await executeQuery(
          con,
          "INSERT INTO collectionitem ( collection, creator, listed, floor, volume, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            // tokenIdData.property_version,
            tokenIdData.collection,
            tokenIdData.creator,
            listedItems.length,
            listedItems.length > 0 ? listedItems[0].price : null,
            parseFloat(token.data.price),
            // new Date(), // Assuming this is the sale timestamp
            0, // Initial owner count
          ]
        );
      } else {
        await executeQuery(
          con,
          "UPDATE collectionitem SET listed = ?, floor = ?, volume = volume + ? WHERE id = ?",
          [
            listedItems.length,
            listedItems.length > 0 ? listedItems[0].price : null,
            parseFloat(token.data.price) / 100000000,
            // new Date(), // Assuming this is the sale timestamp
            // collectionRows[0].owner + 1, // Increment owner count
            collectionRows[0].id,
          ]
        );
      }

      return item;
    } catch (error) {
      throw error;
    }
  }

  let item = startFetchListEvent(
    MARKET_ADDRESS!,
    `${MARKET_ADDRESS}::marketplace::BuyTokenEvent`,
    0
  );
  return item;
};

export const handleCancelRequest = async (tokenIdData: I_TOKEN_ID_DATA) => {
  async function startFetchListEvent(
    account_address: string,
    type: string,
    offset: number
  ) {
    try {
      const { errors, data } = await fetchListEvent(
        account_address,
        type,
        offset
      );

      if (errors) {
        console.error(errors);
      }
      // Find the item in the 'nft_item' table
      const rows: any = await executeQuery(
        con,
        "SELECT * FROM nftitem WHERE " +
          "property_version = ? AND " +
          "collection = ? AND " +
          "creator = ? AND " +
          "name = ?",
        [
          tokenIdData.property_version,
          tokenIdData.collection,
          tokenIdData.creator,
          tokenIdData.name,
        ]
      );

      if (rows.length === 0) {
        return null;
      }
      let item: any = rows[0];
      if (!item) return;
      // Update the 'nft_item' table
      await executeQuery(
        con,
        "UPDATE nftitem SET price = 0, offer_id = 0, isForSale = 0 WHERE id = ?",
        [item.id]
      );
      item.price = 0;
      item.offer_id = 0;
      item.isForSale = 0;

      // Fetch listed items
      const listedItems: any = await executeQuery(
        con,
        "SELECT * FROM nftitem WHERE collection = ? AND isForSale = true ORDER BY price ASC",
        [tokenIdData.collection]
      );
      if (!listedItems) return;
      // Find or insert the collection item in the 'collection_item' table
      const collectionRows: any = await executeQuery(
        con,
        "SELECT * FROM collectionitem WHERE  collection = ? AND creator = ?",
        [tokenIdData.collection, tokenIdData.creator]
      );
      if (collectionRows.length === 0) return;
      await executeQuery(
        con,
        "UPDATE collectionitem SET listed = ?, floor = ? WHERE id = ?",
        [
          listedItems.length,
          listedItems.length > 0 ? listedItems[0].price : null,
          collectionRows.id,
        ]
      );
      /* end */
      return item;
    } catch (error) {
      throw error;
    }
  }

  let item = startFetchListEvent(
    MARKET_ADDRESS!,
    `${MARKET_ADDRESS}::marketplace::CancelSaleEvent`,
    0
  );
  return item;
};

export const metaDatabySlug = async (slug: string) => {
  // Find the metData in the 'metadata' table
  const [rows] = await con.query("SELECT * FROM nftitem WHERE slug = ?", [
    slug,
  ]);
  if (rows.length !== 0) {
    return rows[0];
  } else {
    const [result] = await con.query("SELECT * FROM nftitem WHERE slug = ?", [
      slug,
    ]);
    let collectionType: { [key: string]: any } = {};
    let testType: any[] = [];

    result.map((item: any, i: number) => {
      testType = [...testType, ...item["metadata"]];
    });
    arrayFormat(testType)?.map((_item: any, j: number) => {
      collectionType[_item.trait_type] = [];
    });
    result.map((item: any, i: number) => {
      item["metadata"]?.map(
        (_item: { trait_type: string; value: string }, j: number) => {
          if (
            !collectionType[_item.trait_type].includes(_item.value) &&
            _item.value != "None"
          ) {
            collectionType[_item.trait_type].push(_item.value);
          }
        }
      );
    });
    await con.query("INSERT INTO metadata (slug, metadata) VALUES (?,?)", [
      slug,
      collectionType,
    ]);
    return result;
  }
};

export const collectionMetabySlug = async (slug: string) => {
  return new Promise((resolve, reject) => {
    try {
      // const query = 'SELECT cf.*, ci.* FROM collectionfilter AS cf LEFT JOIN collectionitem AS ci ON cf.slug = ci.slug WHERE cf.slug = ?';
      const query = "SELECT * FROM collectionitem  WHERE slug = ?";
      con.query(query, [slug], (error: any, results: any, fields: any) => {
        if (error) {
          reject(error);
        } else {
          console.log(results);
          resolve(results);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const cronCollectionMetabySlug = async (slug: string) => {
  // Check if data exists in the collectionfilter table
  const [__metaData] = await con.query(
    "SELECT metadata FROM collectionfilter WHERE slug = ?",
    [slug]
  );

  let _metaData: any;

  if (__metaData) {
    _metaData = __metaData;
  } else {
    // If data doesn't exist , build and insert data into collectionfilter table
    const result = await con.query(
      "SELECT metadata FROM nftitem WHERE slug = ?",
      [slug]
    );
    let collectionType: { [key: string]: any } = {};
    let testType: any[] = [];

    result.map((item: any, i: number) => {
      testType = [...testType, ...item["metadata"]];
    });
    arrayFormat(testType)?.map((_item: any, j: number) => {
      collectionType[_item.trait_type] = [];
    });
    result.map((item: any, i: number) => {
      item["metadata"]?.map(
        (_item: { trait_type: string; value: string }, j: number) => {
          if (
            !collectionType[_item.trait_type].includes(_item.value) &&
            _item.value != "None"
          ) {
            collectionType[_item.trait_type].push(_item.value);
          }
        }
      );
    });
    await con.query("INSERT INTO metadata (slug, metadata) VALUES (?, ?)", [
      slug,
      collectionType,
    ]);
    _metaData = await con.query("SELECT * WHERE slug = ? and metadata=?", [
      slug,
      collectionType,
    ]);
  }
  const traits = _metaData["metadata"];

  const response: any = {};
  const promises = [];

  for (const key in traits) {
    response[key] = {};
    for (const val of traits[key]) {
      const countResult = await con.query(
        "SELECT COUNT(*) AS count FROM nftitem WHERE slug = ? AND metadata LIKE ?",
        [slug, `%"trait_type":"${key}","value":"${val}"%`]
      );
      response[key][val] = countResult[0].count;
    }
  }

  // Update the 'collectionfilter' table with the new metadata
  await con.query("UPDATE collectionfilter SET metadata = ? WHERE slug = ?", [
    JSON.stringify(response),
    slug,
  ]);

  return response;
};

export const activitybySlug = async (item: any) => {
  // Define SQL queries
  const selectActivityQuery =
    "SELECT * FROM activity WHERE property_version = ? AND collection = ? AND creator = ? AND name = ? AND timestamp = ? AND price = ?";
  const insertActivityQuery =
    "INSERT INTO activity (property_version, collection, creator, name, timestamp, price, seller, buyer, version, image, slug) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
  try {
    const result: any = await executeQuery(con, selectActivityQuery, [
      item.data.token_id.property_version,
      item.data.token_id.token_data_id.collection,
      item.data.token_id.token_data_id.creator,
      item.data.token_id.token_data_id.name,
      item.data.timestamp ? item.data.timestamp : item.data.sold_at,
      item.data.price
        ? item.data.price / 100000000
        : item.data.price_per_item / 100000000,
    ]);

    if (result.length === 0) {
      const _nftItem: any = await executeQuery(
        con,
        "SELECT * FROM nftitem WHERE property_version = ? AND collection = ? AND creator = ? AND name = ?",
        [
          item.data.token_id.property_version,
          item.data.token_id.token_data_id.collection,
          item.data.token_id.token_data_id.creator,
          item.data.token_id.token_data_id.name,
        ]
      );

      if (_nftItem.length === 0) {
        return "ok";
      }

      const activityItem = {
        property_version: item.data.token_id.property_version,
        collection: item.data.token_id.token_data_id.collection,
        creator: item.data.token_id.token_data_id.creator,
        name: item.data.token_id.token_data_id.name,
        timestamp: item.data.timestamp
          ? item.data.timestamp
          : item.data.sold_at,
        price: item.data.price
          ? item.data.price / 100000000
          : item.data.price_per_item / 100000000,
        seller: item.data.seller,
        buyer: item.data.buyer,
        version: item.transaction_version,
        image: _nftItem[0] ? _nftItem[0].image_uri : "",
        slug: item.data.token_id.token_data_id.collection.replace(
          /[^A-Z0-9]+/gi,
          "-"
        ),
      };

      await executeQuery(con, insertActivityQuery, [
        activityItem.property_version,
        activityItem.collection,
        activityItem.creator,
        activityItem.name,
        activityItem.timestamp,
        activityItem.price,
        activityItem.seller,
        activityItem.buyer,
        activityItem.version,
        activityItem.image,
        activityItem.slug,
      ]);
    }
    return "ok";
  } catch (error) {
    console.error("Error executing the query: " + error);
    return "error";
  }
};
