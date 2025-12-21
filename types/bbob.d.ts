declare module '@bbob/html' {
  type RenderOptions = {
    onlyAllowTags?: string[];
    [key: string]: unknown;
  };

  export default function render(input: string, preset: unknown, options?: RenderOptions): string;
}

declare module '@bbob/preset-html5' {
  export default function presetHtml5(options?: Record<string, unknown>): unknown;
}
