import { setWorldConstructor } from '@cucumber/cucumber';

class CustomWorld {
  assets: string[] = [];
  externalUrls: Set<string> = new Set();
  cspHeader: string = '';
}

setWorldConstructor(CustomWorld);