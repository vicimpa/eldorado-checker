class Funpay {
  async checkItemStatus(id: string) {
    return (await fetch(`https://funpay.com/lots/offer?id=${id}`)).status;
  }
}

export const FunpayAPI = new Funpay();