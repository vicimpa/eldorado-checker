#!/usr/bin/env node
"use strict";

// g2g.ts
var import_console = require("console");
var import_fs = require("fs");

// lib/delay.ts
var delay = (n = 0) => new Promise((r) => setTimeout(r, n));

// lib/query.ts
var query = (o) => Object.entries(o).map(([key, value]) => `${key}=${value}`).join("&");

// lib/Eldorado.ts
var Eldorado = class {
  base = "https://www.eldorado.gg/api";
  async getAccountByName(name) {
    console.log(`Getting id by ${name}`);
    return await fetch(`${this.base}/users/${name}/publicByUsername/`).then((e) => e.json());
  }
  async getItems(id, pageIndex = 1, pageSize = 39, offerType = "Account") {
    const q = query({ pageIndex, pageSize, offerType });
    console.log(`Getting items ${id} with`, JSON.stringify({ pageIndex }));
    return await fetch(`${this.base}/flexibleOffers/user/${id}/?${q}`).then((e) => e.json());
  }
  async fetchItems(id) {
    const items = [];
    let totalPages = 0;
    let pageIndex = 1;
    do {
      const data = await this.getItems(id, pageIndex);
      pageIndex++;
      totalPages = data.totalPages;
      items.push(...data.results);
    } while (pageIndex <= totalPages);
    return items;
  }
};
var EldoradoApi = new Eldorado();

// lib/Funpay.ts
var Funpay = class {
  async checkItemStatus(id) {
    return (await fetch(`https://funpay.com/lots/offer?id=${id}`)).status;
  }
};
var FunpayAPI = new Funpay();

// lib/funpayCheck.ts
var funpayCheck = async (items) => {
  console.log(`Checking`, items.length, "by id");
  let time = 500;
  while (items.length) {
    const item = items.shift();
    const status = await FunpayAPI.checkItemStatus(item.funpayId);
    if (status === 200) {
      time = 500;
      await delay(time);
      continue;
    }
    if (status === 429) {
      time += 200;
      items.push(item);
      await delay(time);
      continue;
    }
    console.log(status, item.id, item.title);
  }
};

// lib/G2G.ts
var G2GStackError = class extends Error {
  constructor(messages) {
    super("ErrorStack: \n" + messages.map((e) => "  " + e.text).join("\n"));
    this.messages = messages;
  }
};
var checkError = (e) => {
  if (e.code !== 2e3)
    throw new G2GStackError(e.messages);
  return e;
};
var G2G = class {
  base = "https://sls.g2g.com";
  async getAccountByName(name) {
    return fetch(`${this.base}/user/profile/${name}`).then((e) => e.json()).then(checkError).then((e) => e.payload);
  }
  async searchBrands(userId, root_id, service_id) {
    const q = query({ root_id, service_id });
    return fetch(`${this.base}/offer/seller/${userId}/brands?${q}`).then((e) => e.json()).then(checkError).then((e) => [].concat(...e.payload.results.map((e2) => e2.brands)));
  }
  async searchItems(seller, brand_id, service_id, page, page_size = 48) {
    const q = query({ seller, brand_id, page, page_size, service_id, currency: "EUR", country: "RU" });
    return fetch(`${this.base}/offer/search?${q}`).then((e) => e.json()).then(checkError).then((e) => e.payload.results);
  }
  async searchResultCount(seller, brand_id, service_id, page, page_size = 48) {
    const q = query({ seller, brand_id, page, page_size, service_id, currency: "EUR", country: "RU" });
    return fetch(`${this.base}/offer/search_result_count?${q}`).then((e) => e.json()).then(checkError).then((e) => e.payload);
  }
  async searchCategory(id, name) {
    return fetch(`${this.base}/offer/seller/${id}/categories?group_by_categories=1`).then((e) => e.json()).then(checkError).then((e) => e.payload.results).then((e) => e.find((e2) => e2.cat_name.en === name));
  }
  async fetchItems(name, pageSize = 48) {
    const result = [];
    const { user_id } = await this.getAccountByName(name);
    const category = await this.searchCategory(user_id, "Accounts");
    if (!category)
      throw new Error("No find category Accounts");
    const brands = await this.searchBrands(user_id, category.cat_id, category.service_id);
    console.log("Search brands", user_id, brands.length);
    for (const { brand_id } of brands) {
      console.log("Run", brand_id);
      const count = await this.searchResultCount(name, brand_id, category.service_id, 1, pageSize);
      if (!count.total_result) {
        continue;
      }
      let page = 0;
      let totalPage = Math.ceil(count.total_result / count.page_size);
      do {
        console.log("Get page", page + 1, "in", totalPage);
        result.push(...await this.searchItems(name, brand_id, category.service_id, ++page, pageSize));
      } while (page < totalPage);
    }
    return result;
  }
};
var G2GAPI = new G2G();

// g2g.ts
var outputStream = (0, import_fs.createWriteStream)("./output.txt");
var myConsole = new import_console.Console(outputStream);
var log = console.log;
console.log = (...args) => {
  log(...args);
  myConsole.log(...args);
};
async function main() {
  const regExp = /ID\((\d+)\)/i;
  console.log(/* @__PURE__ */ new Date());
  let [argvNames = ""] = process.argv.slice(2);
  if (!argvNames) {
    try {
      argvNames = (0, import_fs.readFileSync)("./input.txt", "utf8");
    } catch (e) {
    }
  }
  const names = argvNames.split(/[,\s\n]/).map((e) => e.trim()).filter(Boolean);
  for (const name of names) {
    console.log("Start of", name);
    const items = await G2GAPI.fetchItems(name);
    const need = items.map((e) => ({
      ...e,
      title: e.title,
      id: e.offer_id,
      funpayId: regExp.exec(e.title)?.[1] || null
    })).filter((e) => e.funpayId);
    console.log("Find ", items.length, "items");
    await funpayCheck(need);
    console.log(" ");
  }
}
main().catch(console.error);
