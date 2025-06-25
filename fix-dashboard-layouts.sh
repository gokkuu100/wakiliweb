#!/bin/bash

# List of dashboard page files that need to be updated
files=(
  "/home/prince/Documents/2025/wakiliaiweb/src/app/dashboard/contract-ai/page.tsx"
  "/home/prince/Documents/2025/wakiliaiweb/src/app/dashboard/notifications/page.tsx"
  "/home/prince/Documents/2025/wakiliaiweb/src/app/dashboard/lawyers/page.tsx"
  "/home/prince/Documents/2025/wakiliaiweb/src/app/dashboard/contracts/pending/page.tsx"
  "/home/prince/Documents/2025/wakiliaiweb/src/app/dashboard/contracts/upload/page.tsx"
  "/home/prince/Documents/2025/wakiliaiweb/src/app/dashboard/contracts/sent/page.tsx"
  "/home/prince/Documents/2025/wakiliaiweb/src/app/dashboard/contracts/page.tsx"
  "/home/prince/Documents/2025/wakiliaiweb/src/app/dashboard/contracts/signed/page.tsx"
  "/home/prince/Documents/2025/wakiliaiweb/src/app/dashboard/vault/page.tsx"
)

# Process each file
for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Remove DashboardLayout import
  sed -i "/import.*DashboardLayout.*from.*DashboardLayout/d" "$file"
  
  # Remove AuthGuard import if it exists and is used only for wrapping
  sed -i "/import.*AuthGuard.*from.*AuthGuard/d" "$file"
  
  # Remove opening DashboardLayout tags
  sed -i "s/<DashboardLayout>//" "$file"
  
  # Remove closing DashboardLayout tags  
  sed -i "s/<\/DashboardLayout>//" "$file"
  
  # Remove AuthGuard wrapper patterns
  sed -i "/export default function.*WithAuth/,/^}/d" "$file"
  sed -i "s/export default.*WithAuth;/export default function() { return <>Content<\/> };/" "$file"
  
  echo "Completed $file"
done

echo "All files processed!"
