#!/bin/bash

id=${1}
name=${2}
content=${3}


curl -H 'content-type:  application/json' -X PUT http://localhost:8000/api/rules/${id} -d '{"id":'${id}',"name":"'${name}'","content":"'${content}'"}'
