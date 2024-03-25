#!/bin/bash

dbName=$1

if [[ -z $dbName ]]
then
  echo "usage: $0 <db-name>"
  exit 1
fi

mongoURL="mongodb://admin:trapDmx7@pro.trap4004.com:27017/admin"

mongo $mongoURL << EOM

use $dbName

db.createUser(
  {
    user: "hobbithelper",
    pwd: "hobbitDmx7",
    roles: [
      {
        role: "readWrite",
        db: "$dbName"
      }
    ]
  }
);

exit
EOM
