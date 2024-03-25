#!/bin/bash

id=${1}
name=${2}
response=${3}

curl -H 'content-type:  application/json' -X PUT http://localhost:8000/api/response/${id} -d '{"id":'${id}',"name":"'${name}'","response":'${response}'}'
