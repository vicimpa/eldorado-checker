import { delay } from "./delay";
import { FunpayAPI } from "./Funpay";

export const funpayCheck = async <T extends { id: string, title: string, funpayId: string | null; }>(items: T[]) => {
  console.log(`Checking`, items.length, 'by id');

  let time = 500;

  while (items.length) {
    const item = items.shift()!;
    const status = await FunpayAPI.checkItemStatus(item.funpayId!);

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