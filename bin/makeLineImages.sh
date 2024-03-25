#!/bin/bash

image=$1

if [[ -z $image ]]
then
  echo "usage: $0 <image-file>"
  exit 1
fi

AWS_CREDENTIAL_FILE=$HOME/.ec2/access-keys

dirName=$(dirname $image)
imageBase=$(basename $image .jpg)
imageBase="${imageBase%.*}"

fullImage=${imageBase}Full.jpg
previewImage=${imageBase}Preview.jpg

convert $image -background white -alpha remove -resize x1024 "$dirName/$fullImage"
convert $image -background white -alpha remove -resize x300 "$dirName/$previewImage"

aws s3 cp "$dirName/$fullImage" s3://www.trap4004.com/line/
aws s3 cp "$dirName/$previewImage" s3://www.trap4004.com/line/
