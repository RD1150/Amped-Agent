#!/bin/bash

# Create output file for URL mappings
OUTPUT_FILE="/home/ubuntu/luxestate/cdn-urls.txt"
> "$OUTPUT_FILE"

# Find all media files
find client/public -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" -o -name "*.mp4" -o -name "*.webm" -o -name "*.mp3" -o -name "*.wav" -o -name "*.zip" \) | while read file; do
    echo "Uploading: $file"
    
    # Get relative path from client/public
    relative_path="${file#client/public/}"
    
    # Upload and capture URL
    url=$(manus-upload-file "$file" 2>&1 | grep -o 'https://[^[:space:]]*')
    
    if [ -n "$url" ]; then
        echo "$relative_path|$url" >> "$OUTPUT_FILE"
        echo "  ✓ Uploaded: $url"
    else
        echo "  ✗ Failed to upload $file"
    fi
    
    sleep 0.5
done

echo ""
echo "Upload complete! URL mappings saved to: $OUTPUT_FILE"
