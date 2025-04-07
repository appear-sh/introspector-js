declare module "import-in-the-middle/hook.mjs" {
  export function createHook(options: { url: string }): {
    initialize: () => void
    load: (url: string, context: any, defaultLoad: any) => Promise<any>
    resolve: (
      specifier: string,
      context: any,
      defaultResolve: any,
    ) => Promise<any>
    getFormat: (
      url: string,
      context: any,
      defaultGetFormat: any,
    ) => Promise<any>
    getSource: (
      url: string,
      context: any,
      defaultGetSource: any,
    ) => Promise<any>
  }
}
