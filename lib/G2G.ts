import { query } from "./query";

type TAccount = {
  user_id: string;
  about_me: string;
  avatar: string;
  banner: string;
  video: string;
  caption: string;
  buyer_ranking: number;
  buyer_ranking_value: string;
  username: string;
  verified_seller: string;
  seller_status: string;
  seller_ranking: string;
  seller_ranking_value: string;
  online_datetime: number;
  is_online: boolean;
  user_level: number;
  signup_at: number;
  account_type: string;
  is_account_restricted: boolean;
  profile_settings: {
    is_accept_chat_profile: boolean;
    is_accept_chat_offer: boolean;
    is_show_followers_following: boolean;
  };
  description: string;
  languages: Array<{
    level: string;
    language: string;
  }>;
  video_thumbnail: string;
  user_avatar: string;
  is_seller: boolean;
};

type TItem = {
  total_offer: number;
  converted_unit_price: number;
  display_currency: string;
  display_price: string;
  is_unique: boolean;
  is_group_display: boolean;
  score: number;
  offer_group: string;
  offer_id: string;
  relation_id: string;
  service_id: string;
  brand_id: string;
  region_id: string;
  title: string;
  description: string;
  offer_title_collection_tree: Array<string>;
  primary_img_attributes: Array<any>;
  offer_attributes: Array<{
    collection_id: string;
    dataset_id: string;
  }>;
  filter_attributes: Array<any>;
  offer_group_attributes: {};
  delivery_mode: Array<any>;
  delivery_method_ids: Array<any>;
  available_qty: number;
  reserved_qty: number;
  min_qty: number;
  offer_currency: string;
  unit_price: number;
  unit_name: string;
  other_pricing: Array<any>;
  qty_metric: string;
  wholesale_details: Array<any>;
  other_wholesale_details: Array<any>;
  delivery_speed: string;
  delivery_speed_details: Array<{
    min: number;
    max: number;
    delivery_time: number;
  }>;
  supported_countries: Array<any>;
  satisfaction_rate: number;
  total_rating: number;
  display_to: {};
};

type TBrand = {
  brand_id: string;
  is_official: boolean;
  total_result: number;
};

type TResultCount = {
  total_result: number;
  page_size: number;
  max_total_result: number;
};

type TError = {
  code: number;
  type: string;
  text: string;
};

type TSearchCategory = {
  cat_id: string;
  cat_name: {
    en: string;
    id: string;
    "zh-CN": string;
    "zh-TW": string;
  };
  service_id: string;
  offer_status: {
    live: number;
    delisted: number;
    delisted_by_g2g: number;
    delisted_pending: number;
    denied: number;
  };
};

class G2GStackError extends Error {
  constructor(public messages: TError[]) {
    super('ErrorStack: \n' + messages.map(e => '  ' + e.text).join('\n'));
  }
}

const checkError = (e: any) => {
  if (e.code !== 2000)
    throw new G2GStackError(e.messages);
  return e;
};

class G2G {
  base = 'https://sls.g2g.com';

  async getAccountByName(name: string): Promise<TAccount> {
    return fetch(`${this.base}/user/profile/${name}`)
      .then(e => e.json())
      .then(checkError)
      .then(e => e.payload);
  }

  async searchBrands(userId: string, root_id: string, service_id: string): Promise<TBrand[]> {
    const q = query({ root_id, service_id });
    return fetch(`${this.base}/offer/seller/${userId}/brands?${q}`)
      .then(e => e.json())
      .then(checkError)
      .then(e => [].concat(...e.payload.results.map((e: any) => e.brands)));
  }

  async searchItems(seller: string, brand_id: string, service_id: string, page: number, page_size = 48): Promise<TItem[]> {
    const q = query({ seller, brand_id, page, page_size, service_id, currency: 'EUR', country: 'RU' });

    return fetch(`${this.base}/offer/search?${q}`)
      .then(e => e.json())
      .then(checkError)
      .then(e => e.payload.results);
  }

  async searchResultCount(seller: string, brand_id: string, service_id: string, page: number, page_size = 48): Promise<TResultCount> {
    const q = query({ seller, brand_id, page, page_size, service_id, currency: 'EUR', country: 'RU' });
    return fetch(`${this.base}/offer/search_result_count?${q}`)
      .then(e => e.json())
      .then(checkError)
      .then(e => e.payload);
  }

  async searchCategory(id: string, name: string) {
    return fetch(`${this.base}/offer/seller/${id}/categories?group_by_categories=1`)
      .then(e => e.json())
      .then(checkError)
      .then(e => e.payload.results as TSearchCategory[])
      .then(e => e.find(e => e.cat_name.en === name));
  }

  async fetchItems(name: string, pageSize = 48) {
    const result: TItem[] = [];
    const { user_id } = await this.getAccountByName(name);
    const category = await this.searchCategory(user_id, 'Accounts');

    if (!category)
      throw new Error('No find category Accounts');
    const brands = await this.searchBrands(user_id, category.cat_id, category.service_id);
    console.log('Search brands', user_id, brands.length);

    for (const { brand_id } of brands) {
      console.log('Run', brand_id);

      const count = await this.searchResultCount(name, brand_id, category.service_id, 1, pageSize);
      if (!count.total_result) {
        continue;
      }

      let page = 0;
      let totalPage = Math.ceil(count.total_result / count.page_size);

      do {
        console.log('Get page', page + 1, 'in', totalPage);
        result.push(...await this.searchItems(name, brand_id, category.service_id, ++page, pageSize));
      } while (page < totalPage);
    }

    return result;
  }
}

export const G2GAPI = new G2G();