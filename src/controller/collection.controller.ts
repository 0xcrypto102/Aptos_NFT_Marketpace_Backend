import { I_TOKEN_ID_DATA } from "../types/interfaces";
import con from "../db/dbConfig";
import { resolve } from "path";

export const updateItem = async (
  slug: string,
  amount: string,
  tokenIdata: I_TOKEN_ID_DATA
) => {
  try {
    const [rows] = await con.query(
      "SELECT * FROM collectionitem WHERE token_data_id_collection = ?",
      [slug]
    );
    if (rows.length === 0) return;
    const item = rows[0];
    item.volume += parseFloat(amount);
    await con.query("UPDATE collectionItem SET volume = ? WHERE id = ?", [
      item.volume,
      item.id,
    ]);
    return item;
  } finally {
    con.release();
  }
};

export const fetchItem = async (slug: string) => {
  return new Promise((resolve, reject) => {
    try {
      con.query(
        "SELECT * FROM collectionitem WHERE slug = ?",
        [slug],
        (error: any, results: any, fields: any) => {
          if (error) {
            console.error("Error:", error);
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

export const fetchCollection = async (
  _period: number,
  _page: number,
  _pageSize: number
) => {
  return new Promise((resolve, reject) => {
    try {
      // uncomment this limitTime and use the limitTime in the live server
      // let limitTime = new Date(new Date().getTime() - 3600 * _period * 1000);
      let items: any;
      con.query(
        "SELECT collection, volume, items_total, sales_24h, logo_url, owners_total FROM collectionitem   ORDER BY volume DESC LIMIT ?",
        [_page * _pageSize],
        (error: any, results: any, fields: any) => {
          if (error) {
            console.error("Error:", error);
            reject(error);
          } else {
            items = results;
            con.query(
              "SELECT COUNT(*) as count FROM collectionitem ",
              (error: any, results: any, fields: any) => {
                if (error) {
                  console.error("Error:", error);
                  reject(error);
                } else {
                  if (items.length === 0) {
                    resolve({ items, count: results[0].count });
                  } else {
                    resolve(items);
                  }
                }
              }
            );
          }
        }
      );
    } catch (error) {
      throw error;
    }
  });
};

export const fetchCollectionData = async (slug: string) => {
  try {
    const [rows] = await con.query("SELECT * FROM nftitem WHERE slug = ?", [
      slug,
    ]);
    if (rows.length === 0) return;
    return rows[0];
  } finally {
    con.release();
  }
};

export const fetchActivity = async (slug: string, eventType: string) => {
  return new Promise((resolve, reject) => {
    try {
      let query = "";
      if (eventType === "0") {
        query =
          "SELECT * FROM activity WHERE slug = ? AND (buyer IS NOT NULL) ORDER BY timestamp DESC";
      } else {
        query =
          "SELECT * FROM activity WHERE slug = ? AND (buyer IS  NULL ) ORDER BY timestamp DESC";
      }
      const values: any[] = [slug];
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
