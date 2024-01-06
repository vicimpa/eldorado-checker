type TAccount = {
  id: string;
  username: string;
  picture: {
    smallPicture: string | null;
    mediumPicture: string | null;
    largePicture: string | null;
  },
  description: string | null;
  createdDate: string;
  isVerifiedSeller: boolean;
};

type TImage = {
  smallImage: string | null;
  largeImage: string | null;
  originalSizeImage: string | null;
};

type TItem = {
  offerTitle: string;
  mainOfferImage: TImage;
  offerImages: TImage;
  pricePerUnitInUSD?: null;
  id: string;
  userId: string;
  gameId: string;
  itemId: string;
  itemName: string;
  itemHierarchy: {
    id: string;
    uiJumpToItemTreeId: string;
  }[];
  description: string;
  quantity: number;
  minQuantity: number;
  discounts: any[];
  pricePerUnit: {
    amount: number;
    currency: string;
  };
  guaranteedDeliveryTime: string;
  tradeEnvironmentValues: {
    value: string;
    name: string;
    id: string;
  }[];
  offerAttributeIdValues: any[];
  expireDate: string;
  offerState: string;
  version: string;
  exchangeRate: {
    currency: string;
    exchangeRate: number;
  };
};

type TResult = {
  pageIndex: number;
  totalPages: number;
  pageSize: number;
  recordCount: number;
  results: TItem[];
};

class Eldorado {
  base = 'https://www.eldorado.gg/api';

  async getAccountByName(name: string): Promise<TAccount> {
    console.log(`Getting id by ${name}`);
    return await fetch(`${this.base}/users/${name}/publicByUsername/`)
      .then(e => e.json());
  }

  async getItems(id: string, pageIndex: number = 1, pageSize = 39, offerType = 'Account'): Promise<TResult> {
    const query = Object
      .entries({ pageIndex, pageSize, offerType })
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    console.log(`Getting items ${id} with`, JSON.stringify({ pageIndex }));
    return await fetch(`${this.base}/flexibleOffers/user/${id}/?${query}`)
      .then(e => e.json());
  }

  async fetchItems(id: string) {
    const items: TItem[] = [];

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
}

export const EldoradoApi = new Eldorado();