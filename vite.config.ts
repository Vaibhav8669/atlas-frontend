import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        proxy: {
            '/serial-api': {
                target: 'https://wtapi.atomberg.co.in',
                changeOrigin: true,
                rewrite: (p) =>
                    p.replace(
                        /^\/serial-api/,
                        '/customer/example-api'
                    ),
            },
        },
    },
})
