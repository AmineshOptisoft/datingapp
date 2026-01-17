declare module "gpt-tokenizer" {
  /**
   * `gpt-tokenizer` is published without TypeScript types in some builds.
   * We only use `encode()` for length estimation, so keep this minimal.
   */
  export function encode(text: string): number[];
}

