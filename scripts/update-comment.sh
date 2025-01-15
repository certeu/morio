#!/bin/bash

# Function to update the comment with step status
update_comment() {
  STEP_NAME="$1"
  STATUS="$2"
  ICON="⏳"  # Default icon

  case "$STATUS" in
    "Pending") ICON="⏳" ;;
    "Success") ICON="✅" ;;
    "Fail") ICON="❌" ;;
    *) ICON="⏳" ;;  # Default to Pending if status is unrecognized
  esac

  COMMENT_ID=$3
  GITHUB_TOKEN=$4
  REPO=$5

  # Get the existing comment body
  COMMENT_BODY=$(curl -s -X GET \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/repos/$REPO/issues/comments/$COMMENT_ID | jq -r .body)

  # Check if the step already exists in the comment body
  if echo "$COMMENT_BODY" | grep -q "| $STEP_NAME |"; then
    UPDATED_BODY=$(echo "$COMMENT_BODY" | sed "s/| $STEP_NAME |.*|/| $STEP_NAME | $ICON $STATUS |/")
  else
    UPDATED_BODY=$(echo -e "$COMMENT_BODY\\n| $STEP_NAME | $ICON $STATUS |")
  fi

  ESCAPED_BODY=$(echo "$UPDATED_BODY" | jq -R .)

  # Update the comment body
  curl -s -X PATCH \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -d "{\"body\": \"$ESCAPED_BODY\"}" \
    https://api.github.com/repos/$REPO/issues/comments/$COMMENT_ID > /dev/null
}

# Ensure that arguments are passed
if [ "$#" -ne 5 ]; then
  echo "Usage: $0 <step_name> <status> <comment_id> <github_token> <repo>"
  exit 1
fi

# Call the update function with provided arguments
update_comment "$1" "$2" "$3" "$4" "$5"
