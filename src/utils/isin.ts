const KRX_ISIN_RE = /^KR\d{10}$/;

export function matchesIsuCode(
  isuCd: string,
  srtCd: string,
  query: string,
): boolean {
  if (isuCd === query || srtCd === query) return true;
  if (KRX_ISIN_RE.test(query)) {
    const short = query.slice(3, 9);
    return isuCd === short || srtCd === short;
  }
  return false;
}
