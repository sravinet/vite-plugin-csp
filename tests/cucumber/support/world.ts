// Assuming this is where CustomWorld is defined
import { setWorldConstructor } from '@cucumber/cucumber';

class CustomWorld {
  assets: string[] | null;
  externalUrls: Set<string> | null;
  cspHeader: string | null;

  constructor() {
    this.assets = null;
    this.externalUrls = null;
    this.cspHeader = null;
  }
}

setWorldConstructor(CustomWorld);