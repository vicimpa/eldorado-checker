#!/usr/bin/env node
"use strict";

// eldorado.ts
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

// eldorado.ts
var outputStream = (0, import_fs.createWriteStream)("./output.txt");
var myConsole = new import_console.Console(outputStream);
var log = console.log;
console.log = (...args) => {
  log(...args);
  myConsole.log(...args);
};
async function main() {
  const regExp = /\#(\d+)/;
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
    const { id } = await EldoradoApi.getAccountByName(name);
    const items = await EldoradoApi.fetchItems(id);
    console.log(`Finding`, items.length, "items");
    const need = items.map((e) => ({
      ...e,
      id: e.id,
      title: e.offerTitle,
      funpayId: regExp.exec(e.description)?.[1] ?? null
    })).filter((e) => e.funpayId);
    await funpayCheck(need);
    console.log(" ");
  }
}
main().catch(console.error);
