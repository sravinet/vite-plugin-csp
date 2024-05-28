import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { generateCspHeader } from '../../../src/utils/csp-utils.ts';

let assets: string[] = [];
let externalUrls: Set<string> = new Set<string>();
let cspHeader: string;

console.log("Step definitions loaded");


Given('the following assets:', (dataTable: { rawTable: string[][] }) => {
  assets = dataTable.rawTable.slice(1).map((row: string[]) => row[0]);
});

Given('the following external URLs:', (dataTable: { rawTable: string[][] }) => {
  externalUrls = new Set<string>(dataTable.rawTable.slice(1).map((row: string[]) => row[0]));
});

When('I generate the CSP headers', () => {
  cspHeader = generateCspHeader(new Set<string>(assets), externalUrls);
});

Then('the CSP headers should include:', (dataTable: { rawTable: string[][] }) => {
  const expectedDirectives: string[][] = dataTable.rawTable.slice(1);
  expectedDirectives.forEach((directiveArray: string[]) => {
    if (directiveArray.length === 2) {
      const [directive, value] = directiveArray;
      expect(cspHeader).to.include(`${directive} ${value}`);
    } else {
      throw new Error('Each directive should have exactly two elements');
    }
  });
});