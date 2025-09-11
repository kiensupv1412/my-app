zip -r my-app-clean.zip . \
  -x "*/node_modules/*" \
  -x "*/.git/*" \
  -x "*/.next/*" \
  -x "*/dist/*" \
  -x "*/build/*" \
  -x ".gitignore" \
  -x "package-lock.json" \
  -x "yarn.lock" \
  -x "pnpm-lock.yaml"
