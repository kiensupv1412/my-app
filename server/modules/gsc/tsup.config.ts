import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { gsc: 'cli.ts' },      // hoặc src/cli.ts nếu bạn để trong src
    format: ['cjs'],               // CLI CJS cho chắc (hoặc ['esm','cjs'] nếu cần)
    target: 'node20',
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    dts: false,                    // CLI không cần .d.ts
    external: ['googleapis', 'google-auth-library', 'hpagent'],
});