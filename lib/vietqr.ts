export interface VietQRParams {
  bankCode: string; // slug like vietinbank
  accountNumber: string;
  template?: string; // compact2, compact, qr_only
  amount?: number; // VND
  description?: string; // addInfo (encoded)
  accountName?: string; // accountName param (encoded)
  fileExt?: 'png' | 'jpg';
}

export function buildVietQRUrl(params: VietQRParams): string {
  const {
    bankCode,
    accountNumber,
    template = 'compact2',
    amount,
    description,
    accountName,
    fileExt = 'png'
  } = params;
  if (!bankCode || !accountNumber) return '';
  const base = `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(accountNumber)}-${encodeURIComponent(template)}.${fileExt}`;
  const query: string[] = [];
  if (amount && amount > 0) query.push(`amount=${amount}`);
  if (description) query.push(`addInfo=${encodeURIComponent(description)}`);
  if (accountName) query.push(`accountName=${encodeURIComponent(accountName)}`);
  return query.length ? `${base}?${query.join('&')}` : base;
}
