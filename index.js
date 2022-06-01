const got = require("got");
const delay = require("delay");
const fs = require("fs");
const c = require("cookie");
const { stringify } = require("querystring");
const stripJsonComments = require("./strip-json");
const { nanoid } = require("nanoid");

const json = fs.readFileSync("./fuck-target.json", { encoding: "utf-8" });

const fuckTarget = JSON.parse(stripJsonComments(json));
// console.log(fuckTarget);
const BILIBILI_API = "https://api.bilibili.com";

const IsDev = process.env.NODE_ENV === "development";

if (!IsDev && !process.env.COOKIE) {
  throw new Error("Please set Cookie");
}

const COOKIE = process.env.COOKIE;

const cookie = c.parse(COOKIE);

const reqApi = got.extend({
  prefixUrl: BILIBILI_API,
  responseType: "json",
  hooks: {
    beforeRequest: [
      (options) => {
        options.headers["Cookie"] = COOKIE;
        options.headers["Referer"] = "https://www.bilibili.com/";
        options.headers["User-Agent"] =
          "Mozilla/5.0 (Windows NT 10.0;Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36";
        options.headers["Connection"] = "keep-alive";
        options.headers["Content-Type"] =
          "application/x-www-form-urlencoded; charset=UTF-8";
        options.headers["Origin"] = "https://www.bilibili.com";
        options.headers["Sec-GPC"] = "1";
        options.headers["Sec-Fetch-Site"] = "same-site";
        options.headers["Sec-Fetch-Mode"] = "cors";
        options.headers["Sec-Fetch-Dest"] = "empty";
        options.headers["Accept-Language"] = "zh-CN,zh;q=0.9";
      },
    ],
  },
});

const getVideos = async function (id) {
  const res = await reqApi.get("x/space/arc/search", {
    searchParams: {
      mid: id,
      pn: 1,
      ps: 100,
    },
    headers: {
      Referer: "https://space.bilibili.com/",
    },
  });
  return res.body;
};

const replyVideo = async function (data) {
  const res = await reqApi.post("x/v2/reply/add ", {
    body: data,
  });
  return res.body;
};

const fuckHe = async function (who) {
  let videos = await getVideos(who.uid);
  videos = videos.data.list.vlist;
  for await (const video of videos) {
    const aid = video.aid;
    console.log(`------${aid}--------------------------`);
    const res = await replyVideo(
      stringify({
        oid: aid,
        type: "1",
        plat: "1",
        ordering: "heat",
        message: who.message,
        jsonp: "jsonp",
        csrf: cookie.bili_jct,
      })
    );
    if (!!res.data && !!res.data.success_toast) {
      console.log(res.data.success_toast);
    } else {
      console.log(res);
    }
    console.log(
      `--${res.code}-------${res.message}---------------------------------------`
    );

    await delay(360000);
  }
};

async function main() {
  for await (const t of fuckTarget) {
    switch (t.action) {
      case "reply":
        while (true) {
          const message = (t.withUUID ? nanoid() + "____" : "") + t.message;
          const res = await replyVideo(
            stringify({
              oid: t.oid,
              type: "1",
              plat: "1",
              ordering: "heat",
              root: t.root,
              parent: t.parent,
              message,
              jsonp: "jsonp",
              csrf: cookie.bili_jct,
            })
          );
          console.log(`--${res.code}----${res.message}------${message}`);
          await delay(1800000);
        }
      case "":
        await fuckHe(t);
    }

    await delay(5000);
  }
}

main();
