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

  async searchBrands(userId: string): Promise<TBrand[]> {
    return fetch(`${this.base}/offer/seller/${userId}/brands`)
      .then(e => e.json())
      .then(checkError)
      .then(e => e.payload.results);
  }

  async searchItems(name: string, brand_id: string, page: number, pageSize = 48): Promise<TItem[]> {
    return fetch(`${this.base}/offer/search?brand_id=${brand_id}&currency=EUR&country=RU&seller=${name}&page=${page}&page_size=${pageSize}`)
      .then(e => e.json())
      .then(checkError)
      .then(e => e.payload.results);
  }

  async searchResultCount(name: string, brand_id: string, page: number, pageSize = 48): Promise<TResultCount> {
    return fetch(`${this.base}/offer/search_result_count?brand_id=${brand_id}&currency=EUR&country=RU&seller=${name}&page=${page}&page_size=${pageSize}`)
      .then(e => e.json())
      .then(checkError)
      .then(e => e.payload);
  }

  async fetchItems(name: string, pageSize = 48) {
    const result: TItem[] = [];
    const { user_id } = await this.getAccountByName(name);
    const brands = await G2GAPI.searchBrands(user_id);

    console.log('Search brands', user_id);

    for (const { brand_id } of brands) {
      console.log('Run', brand_id);

      const count = await G2GAPI.searchResultCount(name, brand_id, 1, pageSize);
      if (!count.total_result) {
        continue;
      }


      let page = 0;
      let totalPage = Math.ceil(count.total_result / count.page_size);

      do {
        console.log('Get page', page + 1, 'in', totalPage);
        result.push(...await G2GAPI.searchItems(name, brand_id, ++page, pageSize));
      } while (page < totalPage);
    }

    return result;
  }
}

export const G2GAPI = new G2G();