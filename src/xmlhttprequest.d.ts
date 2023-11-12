declare global {
  interface XMLHttpRequest {
    _method?: string;
    _url?: string;
  }
}
