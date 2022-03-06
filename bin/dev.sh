#!/bin/bash

dev_file=".devpath"
package_path="node_modules/inventor"

if [ ! -f "$dev_file" ]; then
    touch "$dev_file"
    echo "============================================"
    echo "Please write you project path in .devpath"
    echo "============================================"
    exit 1
fi

echo "============================================"
echo "package in on dev mode，don't forget recover you project dependencies by `yarn install` "
echo "============================================"

dev_path=`cat ${dev_file}`
full_path="${dev_path}/${package_path}"

babel src -d "$full_path" -D --watch
