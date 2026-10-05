// Minimal unary XMLHttpRequest adapter for running the browser Firebase SDK in Node.
// Firestore's realtime streams use its own fetch transport.
export class FetchXmlHttpRequest extends EventTarget {
  readyState = 0;
  status = 0;
  statusText = "";
  responseText = "";
  response = "";
  headers = {};
  onreadystatechange = null;
  open(method, url) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }
  setRequestHeader(key, value) {
    this.headers[key] = value;
  }
  getResponseHeader(key) {
    return this.responseHeaders?.get(key) ?? null;
  }
  getAllResponseHeaders() {
    return [...(this.responseHeaders?.entries() ?? [])]
      .map(([key, value]) => `${key}: ${value}`)
      .join("\r\n");
  }
  async send(body) {
    this.controller = new AbortController();
    try {
      const result = await fetch(this.url, {
        method: this.method,
        headers: this.headers,
        body,
        signal: this.controller.signal,
      });
      this.status = result.status;
      this.statusText = result.statusText;
      this.responseHeaders = result.headers;
      this.responseText = await result.text();
      this.response = this.responseText;
      this.readyState = 4;
      this.onreadystatechange?.();
      this.dispatchEvent(new Event("readystatechange"));
    } catch (error) {
      this.status = 0;
      this.readyState = 4;
      this.onreadystatechange?.();
      this.dispatchEvent(new Event("error"));
    }
  }
  abort() {
    this.controller?.abort();
  }
}
