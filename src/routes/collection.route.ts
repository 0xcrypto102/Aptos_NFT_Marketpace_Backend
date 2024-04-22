import express, { Request, Response } from "express";
import { I_TOKEN_ID_DATA } from "../types/interfaces";

import {
  updateItem,
  fetchItem,
  fetchCollection,
  fetchCollectionData,
  fetchActivity,
} from "../controller/collection.controller";
import { cache } from "../utils/graphql";
import { lstat } from "fs";

async function fetchTopCollection(req: Request, res: Response) {
  try {
    let period: any = req.query?.period;
    let page: any = req.query?.page;
    let pageSize: any = req.query?.pageSize;

    let data = cache.get(period + page + +pageSize + "fetchCollection");
    if (!data) {
      data = data = await fetchCollection(
        parseInt(period),
        parseInt(page),
        parseInt(pageSize)
      );
      cache.set(period + page + pageSize + "fetchCollection", data);
    }
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send({ response: "Error", result: err });
  }
}

// async function updateCollection(req: Request, res: Response) {
//   try {
//     let { slug, amount } = req.params;
//     const body: I_TOKEN_ID_DATA = req.body;
//     let data = cache.get(slug + amount + "updateCollection");
//     if (!data) {
//       data = await updateItem(slug, amount, body);
//       cache.set(slug + amount + "updateCollection", data);
//     }
//     return res.status(200).send(data);
//   } catch (err) {
//     return res.status(500).send({ response: "Error", result: err });
//   }
// }

async function fetchParams(req: Request, res: Response) {
  try {
    let { slug } = req.params;
    let data = cache.get(slug + "fetchParams");
    if (!data) {
      data = await fetchItem(slug);
      cache.set(slug + "fetchParams", data);
    }
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send({ response: "Error", result: err });
  }
}

async function fetchCollectionDataBySlug(req: Request, res: Response) {
  try {
    let { slug } = req.params;
    let data = cache.get(slug + "fetchCollectionDataBySlug");
    if (!data) {
      data = await fetchCollectionData(slug);
      cache.set(slug + "fetchCollectionDataBySlug", data);
    }
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send({ response: "Error", result: err });
  }
}

async function fetchActivityBySlug(req: Request, res: Response) {
  try {
    let { slug, eventType } = req.params;
    let data = cache.get(slug + eventType + "fetchActivityBySlug");
    if (!data) {
      data = await fetchActivity(slug, eventType);
      cache.set(slug + eventType + "fetchActivityBySlug", data);
    }
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send({ response: "Error", result: err });
  }
}

module.exports = () => {
  const collectionRoute = express.Router();
  collectionRoute.get("/collection/fetch", fetchTopCollection);
  // collectionRoute.put("/update/:slug/:amount", updateCollection);
  collectionRoute.get("/:slug", fetchParams);
  collectionRoute.get("/collection/:slug", fetchCollectionDataBySlug);
  collectionRoute.get("/activity/:eventType/:slug", fetchActivityBySlug);
  return collectionRoute;
};
