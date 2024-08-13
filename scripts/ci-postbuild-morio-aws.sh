#!/bin/bash
#
# This script will run the postbuild steps for AWS images.
# It is created for a CI environment, but should also run fine
# on a system that has the AWS cli installed.
#
# When running this locally, make sure to set the following
# environment variables:
#
#  - AWS_ACCESS_KEY_ID
#  - AWS_SECRET_ACCESS_KEY
#

# Sounce config variables
source config/cli.sh

#
# Make sure we are in the repo, and have a folder to save data to
#
cd $MORIO_GIT_ROOT
mkdir -p build-context
FILE="aws.json"
SRC="build-context/$FILE"
DEST="docs/static/images"
mkdir -p $DEST

#
# Get the list of AMIs from AWS that are tagged as being morio images
#
echo "Getting list of AMIs from AWS"
IMAGES=$(aws ec2 describe-images --region="us-east-1" --owners self --filters "Name=tag:morio,Values=true")
echo $IMAGES | jq .Images > $SRC/$FILE

#
# Iterate over the images to see if they are public
#
jq -c '.[]' "$SRC/$FILE" | while IFS= read -r item; do
  # Is the image public?
  if echo "$item" | jq -e '.Public == false' > /dev/null; then
    imageId=$(echo "$item" | jq -r '.ImageId')
    echo "Image $imageId is not public. Changing that now."
    aws ec2 modify-image-attribute --region="us-east-1" --image-id $imageId --launch-permission "Add=[{Group=all}]"
  fi
done

#
# Does the list of images differ from what's in the repo?
#
diff $SRC/$FILE $DIET/$FILE > /dev/null 2>&1
if [ $? -eq 0 ];
then
  echo "No changes detected in the list of AMI images"
else
  echo "Changes detected in the list of AMI images"

  if [ -z "$1" ];
  then
  echo "Not creating a pull request with the updated AWS images list"
  exit 0
  else
  echo "Creating a new branch with the updated AWS images list"
  BRANCH="ci-awsamis-$(date +%s)"
  git switch -c $BRANCH
  echo "Branch created: $BRANCH"
  echo "Adding new images list"
  cp $SRC/$FILE $DEST/$FILE
  echo "Creating commit"
  git add $DEST/$FILE
  git config user.email "bot@morio.it"
  git config user.name "Morio Bot"
  git commit -m "chore: Updated list of published AMIs on AWS"
  git push --set-upstream origin $BRANCH
  echo "Creating pull request"
  # See: https://github.com/cli/cli/issues/5896#issuecomment-1783831619
  git fetch origin develop
  gh pr create \
    --assignee joostdecock \
    --base develop \
    --body "This updates the list of published AMI images on AWS" \
    --fill \
    --label bot \
    --reviewer joostdecock \
    --title "chore: Update list of published AWS AMI images"
  fi
fi

