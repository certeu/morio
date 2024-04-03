#!/bin/bash
#
# Check that a specific version
if [ -z "$1" ];
then
  # Figure out the repository root
  REPO="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd )"

  # Grab the Morio version from package.json
  VERSION=`sed 's/\"version\"/\"VERSION\"/' $REPO/package.json | grep VERSION | tr -d 'VERSION [:blank:] ["] [:] [,]'`
else
  VERSION=$1
fi

SERVICES=( api core ui dbuilder )

mkdir -p $REPO/data/data/tmp_static

for SERVICE in "${SERVICES[@]}"
do
  FILE=$REPO/data/data/tmp_static/morio-$SERVICE-$VERSION.tar
  echo "🚚 Exporting image morio/$SERVICE:$VERSION"
  sudo docker image save morio/$SERVICE:$VERSION -o $FILE
  echo "✅ Exported image morio/$SERVICE:$VERSION to $FILE"
done
