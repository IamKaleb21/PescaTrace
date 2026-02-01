declare module "react-csv" {
  import { ComponentType } from "react";

  export interface CSVLinkProps {
    data: object[] | string;
    filename?: string;
    headers?: string[];
    separator?: string;
    className?: string;
    children?: React.ReactNode;
  }

  export const CSVLink: ComponentType<CSVLinkProps>;
}
