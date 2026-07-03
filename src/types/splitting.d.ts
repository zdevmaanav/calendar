declare module 'splitting' {
  interface SplittingOptions {
    target?: string | Element | Element[];
    by?: string;
    key?: string;
  }

  interface SplittingResult {
    el: Element;
    chars?: HTMLElement[];
    words?: HTMLElement[];
    lines?: HTMLElement[];
  }

  function Splitting(options?: SplittingOptions): SplittingResult[];

  export default Splitting;
}

declare module 'splitting/dist/splitting.css';
