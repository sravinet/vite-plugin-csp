Feature: Generate CSP Headers
  As a developer
  I want to generate Content Security Policy (CSP) headers
  So that I can enhance the security of my Remix project

  Scenario: Generate CSP headers for given assets and external URLs
    Given the following assets:
      | asset         |
      | script.js     |
      | style.css     |
      | image.png     |
    And the following external URLs:
      | url                        |
      | https://example.com/script.js |
      | https://example.com/style.css |
    When I generate the CSP headers
    Then the CSP headers should include:
      | directive      | value                                      |
      | script-src     | 'self' 'nonce-script.js' https://example.com/script.js |
      | style-src      | 'self' 'nonce-style.css' https://example.com/style.css |
      | img-src        | 'self' data: image.png                     |
      | font-src       | 'self'                                     |
      | connect-src    | 'self'                                     |