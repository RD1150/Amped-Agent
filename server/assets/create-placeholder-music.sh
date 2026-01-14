#!/bin/bash
# Create placeholder silent audio files for testing video conversion

cd /home/ubuntu/luxestate/server/assets/music

# Create 30-second silent MP3 files for each music track
for music_id in steady_ride whiskey_sunrise dirt_road_dreams one_more_night highway_stars back_home by_the_river camping_in_the_woods good_year electric_nights summer_vibes rock_anthem; do
  ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 30 -q:a 9 -acodec libmp3lame "${music_id}.mp3" -y 2>/dev/null
  echo "Created ${music_id}.mp3"
done

echo "All placeholder music files created!"
