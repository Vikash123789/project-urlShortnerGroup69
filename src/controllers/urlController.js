const UrlModel = require("../models/urlModel");
const ShortId = require("shortid");
const redis = require("redis");
const { promisify } = require("util");
//For Check Input Value Is Valid Or Not
const isValid = function (value) {
  if (typeof value == "undefined" || value == null) return false;
  if (typeof value == "string" && value.trim().length > 0) return true;
  return false;
};

//Check Body Is Empty Or Not
const isValidRequest = function (object) {
  return Object.keys(object).length > 0;
};

//Regex For Validating ValidUrl Format
const isValidUrl = function (value) {
  let regexForUrl =
    /(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1})?([a-zA-Z0-9]{1,}[\.])[\w]*((\/){1}([\w@?^=%&amp;~+#-_.]+))*)$/;
  return regexForUrl.test(value);
};

//Connection Create For Redis...................

const redisClient = redis.createClient(
  10430,
  "redis-10430.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("I6NAbnxF1VhsJr7BJjZLdsqpXKwSDStI", function (err) {
  if (err) throw err;
});
redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//Function Create For URL Shortner

const urlShortner = async function (req, res) {
  try {
    const BodyData = req.body;
    const queryParamsData = req.query;

    if (isValidRequest(queryParamsData)) {return res.status(400)
        .send({ status: false, message: "InValid request" });
    }

    if (!isValidRequest(BodyData)) {return res
        .status(400).send({ status: false, message: "Data is required" });
    }

    const longUrl = req.body.longUrl;
    const base = "http://localhost:3000/";

    if (!isValid(longUrl)) {
      return res.status(400).send({ status: false, message: "URL is required" });
    }

    if (Object.keys(BodyData).length > 1) {
      return res.status(400).send({ status: false, message: "Enter Some Valid request" });
    }

    if (!isValidUrl(longUrl)) {
      return res.status(400).send({ status: false, message: "Enter a valid URL" });
    }

    const urlDataFromCache = await GET_ASYNC(longUrl);
    if (urlDataFromCache) {
      const data = {longUrl: longUrl,urlCode: urlDataFromCache,shortUrl: base + urlDataFromCache,
      };
      res.status(200).send({status: true,msg: "Url shorten successfully",data: data,
      });
    } else {
      const urlDataFromDB = await UrlModel.findOne({ longUrl }).select({shortUrl: 1,longUrl: 1,urlCode: 1,      _id: 0,
      });

      if (urlDataFromDB) {
       const addingUrlDataInCacheByLongUrl = await SET_ASYNC(urlDataFromDB.longUrl,urlDataFromDB.urlCode
        );

        const addingUrlDataInCacheByUrlCode = await SET_ASYNC(urlDataFromDB.urlCode,urlDataFromDB.longUrl
        );

        return res.status(201).send({status: true,msg: "URL shorten successfully",data: url,
        });
      } else {
        const urlCode = ShortId.generate().toLowerCase();
        const shortUrl = base + urlCode;

        const urlData = {urlCode: urlCode,longUrl: longUrl.trim(),shortUrl: shortUrl,
        };

        const newUrl = await UrlModel.create(urlData);

        const addingUrlDataInLongUrl = await SET_ASYNC(urlData.longUrl,urlData.urlCode );

        const addingUrlDataIncacheByUrlCode = await SET_ASYNC(urlData.urlCode,urlData.longUrl);

        return res.status(201).send({status: true,message: "Url Shorten Successfully",data: urlData,});
      }
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};


//Function Create For GetShortUrl 

const getUrl = async function (req, res) {
  try {

    const requestBody = req.body;
    const queryParams = req.query;

    if (isValidRequest(queryParams)) {
      return res.status(400).send({ status: false, message: "Invalid request" });
    }

    if (isValidRequest(requestBody)) {
      return res.status(400).send({ status: false, message: " Input Data is Not Required In Body" });
    }

    const urlCode = req.params.urlCode;

    if (!urlCode) {
      return res.status(400).send({ status: false, message: " URL-Code is required" });
    }

    const urlDataFromcache = await GET_ASYNC(urlCode);

    if (urlDataFromcache) {
      return res.redirect(urlDataFromcache);
    } else {
      const urlDataByUrlCode = await UrlModel.findOne({ urlCode });

      if (!urlDataByUrlCode) {
        return res.status(404).send({ status: false, message: "No Such URL exist" });
      }

      const addingUrlDataIncacheByUrlCode = SET_ASYNC(urlCode,urlDataByUrlCode.longUrl);
      const addingUrlDataInCacheByLongUrl = SET_ASYNC(urlDataByUrlCode.longUrl,urlCode);

      return res.redirect(urlDataByUrlCode.longUrl);
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

module.exports.urlShortner = urlShortner;
module.exports.getUrl= getUrl;
