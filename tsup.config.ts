import { defineConfig } from "tsup"

export default defineConfig({
    entry:["src/server.ts"],
    format:["esm"],
    target:"esnext",
    outDir:"dist",
    clean:true,
    bundle:true,
    splitting:true,
    sourcemap:true,

    banner:{
        js:`
        import {createRequire} from 'module';
        const require = createRequire(import.meta.url);
        `
    }
})