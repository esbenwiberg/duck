import React from "react";
import DuckAgent from "@site/src/components/DuckAgent";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DuckAgent />
    </>
  );
}
