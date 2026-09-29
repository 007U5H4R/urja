// EXE23: /message?lang=en (next.config.ts rewrites it here, keeping the query), the same page as
// /message under the English root layout. The page reads ?lang= itself, as it always has.
export { default, generateMetadata } from "../../../(phone)/message/page";
