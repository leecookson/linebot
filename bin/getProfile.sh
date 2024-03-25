#!/bin/bash

userID=${1}

if [[ -z $userID ]]
then
  echo "usage: $0 lineID"
  exit 0
fi

cd $LINEBOTHOME

. .env

curl -s -H "Authorization: Bearer $HELPER_CHANNEL_ACCESS_TOKEN" ${LINE_SERVICE}/profile/${userID}
