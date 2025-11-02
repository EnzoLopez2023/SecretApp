// TypeScript declaration override for Material-UI v7 Grid compatibility
// This file resolves the Grid component API changes in MUI v7

declare module '@mui/material/Grid' {
  interface GridProps {
    item?: boolean;
    xs?: boolean | number;
    sm?: boolean | number;
    md?: boolean | number;
    lg?: boolean | number;
    xl?: boolean | number;
  }
}

declare module '@mui/system' {
  interface GridBaseProps {
    item?: boolean;
    xs?: boolean | number;
    sm?: boolean | number;
    md?: boolean | number;
    lg?: boolean | number;
    xl?: boolean | number;
  }
}