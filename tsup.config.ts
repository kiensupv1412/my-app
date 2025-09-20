import { defineConfig } from "tsup";

export default defineConfig({
    entry: { gsc: 'server/modules/gsc.ts' },              // đổi theo entry của bạn
    format: ['esm', 'cjs'],
    target: 'node20',
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    dts: true,                                 // cần type? giữ true
    banner: { js: '#!/usr/bin/env node' },     // để chạy như CLI
    // Quan trọng: đẩy lib nặng ra external để giảm bundle
    external: [
        'googleapis',
        'google-auth-library',
        'hpagent',
        // thêm các lib lớn khác nếu có
    ],
});