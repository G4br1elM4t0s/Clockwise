/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "*.svg?react" {
  import * as React from "react"
  const SVGComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>
  export default SVGComponent
}
