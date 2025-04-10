declare module 'mjml' {
  interface MJMLParseResults {
    html: string;
    errors: any[];
  }

  export default function mjml2html(mjml: string): MJMLParseResults;
} 