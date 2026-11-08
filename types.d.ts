declare module 'troika-three-text' {
  export * from 'troika-types/packages/troika-three-text/dist/src/index';
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

