import express, { Request, Response, request } from "express";
import {
  I_UPDATE_REQUEST,
  I_TOKEN_ID_DATA,
  I_TOKEN_SLUG,
} from "../types/interfaces";
import {
  fetchListToken,
  handleMintRequest,
  handleListingRequest,
  handleCancelRequest,
  handleBuyRequest,
  updateListToken,
  handleNft,
  handleNfts,
  handleCollectionNft,
  collectedNft,
  collection,
  metaDatabySlug,
  collectionMetabySlug,
} from "../controller/nft.controller";
import { cache } from "../utils/graphql";

async function fetchUsers(req: Request, res: Response) {
  try {
    let data = cache.get("fetchUsers");
    if (!data) {
      data = await fetchListToken();
      cache.set("fetchUsers", data);
    }
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send({ response: "Error", result: err });
  }
}

async function updateItem(req: Request, res: Response) {
  try {
    const body: I_UPDATE_REQUEST = req.body;
    // let data = cache.get(body.type + "updateItem");
    // if (!data) {
    let data: any;
    switch (body.type) {
      case "REQUEST_MINT":
        data = await handleMintRequest(body.tokenId);
        // cache.set(body.type + "updateItem");
        break;
      case "REQUEST_LIST":
        data = await handleListingRequest(body.tokenId);
        // cache.set(body.type + "updateItem");
        break;
      case "REQUEST_CANCEL":
        data = await handleCancelRequest(body.tokenId);
        // cache.set(body.type + "updateItem");
        break;
      case "REQUEST_PURCHASE":
        data = await handleBuyRequest(body.tokenId);
        // cache.set(body.type + "updateItem");
        break;
      default:
        break;
    }
    // }
    // let data = await updateListToken(req.body);
    return res.status(200).send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ response: "Error", result: err });
  }
}

async function fetchNft(req: Request, res: Response) {
  try {
    const body: I_TOKEN_SLUG = req.body;
    let data = cache.get(JSON.stringify(body) + "fetchNft");
    if (!data) {
      data = await handleNft(body);
      cache.set(JSON.stringify(body) + "fetchNft");
    }
    return res.status(200).send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ response: "Error", result: err });
  }
}
async function fetchCollectionData(req: Request, res: Response) {
  try {
    const body: I_TOKEN_SLUG = req.body;
    let data = cache.get(JSON.stringify(body) + "fetchCollectionData");
    if (!data) {
      data = await handleCollectionNft(body);
      cache.set(JSON.stringify(body) + "fetchCollectionData");
    }
    return res.status(200).send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ response: "Error", result: err });
  }
}

async function fetchCollectedNftByAddress(req: Request, res: Response) {
  try {
    let address: string = req.params.address;
    let page: any = req.query?.page;
    let pageSize: any = req.query?.pageSize;
    let slug = req.query.slug as string;
    let data = cache.get(address + slug + "fetchCollectedNftByAddress");
    if (!data) {
      data = await collectedNft(
        address,
        slug,
        parseInt(page),
        parseInt(pageSize)
      );
      cache.set(address + slug + "fetchCollectedNftByAddress");
    }
    return res.status(200).send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ response: "Error", result: err });
  }
}
async function fetchCollection(req: Request, res: Response) {
  try {
    let slug: string = req.params.slug;
    let filter: string = req.query?.filter as string;
    let isForSale: any = req.query?.isForSale! || false;

    let _page: any = req.query?.page;
    let _pageSize: any = req.query?.pageSize;

    let data = cache.get(slug + filter + isForSale + "fetchCollection");
    if (!data) {
      data = await collection(
        decodeURIComponent(slug),
        isForSale,
        filter,
        _page,
        _pageSize
      );
      cache.set(slug + filter + isForSale + "fetchCollection");
    }
    return res.status(200).send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ response: "Error", result: err });
  }
}
async function fetchCollectionMetaData(req: Request, res: Response) {
  try {
    let slug: string = req.params.slug;
    let data = cache.get(slug + "fetchCollectionMetaData");
    if (!data) {
      data = await collectionMetabySlug(decodeURIComponent(slug));
      cache.set(slug + "fetchCollectionMetaData");
    }
    return res.status(200).send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ response: "Error", result: err });
  }
}

async function updateCollectionMetaData(req: Request, res: Response) {
  try {
    let slug: string = req.params.slug;
    let data = cache.get(slug + "updateCollectionMetaData");
    if (!data) {
      data = await metaDatabySlug(decodeURIComponent(slug));
      cache.set(slug + "updateCollectionMetaData");
    }
    return res.status(200).send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ response: "Error", result: err });
  }
}

module.exports = () => {
  const nftRoute = express.Router();
  nftRoute.get("/fetch", fetchUsers);
  nftRoute.put("/update", updateItem);
  nftRoute.put("/nft", fetchNft);
  nftRoute.put("/collection/nft", fetchCollectionData);
  nftRoute.get("/collected/:address", fetchCollectedNftByAddress);
  nftRoute.get("/collection/:slug", fetchCollection);
  nftRoute.get("/metadata/:slug", fetchCollectionMetaData);
  nftRoute.get("/updatemetadata/:slug", updateCollectionMetaData);

  return nftRoute;
};
