{{{ CI_HEADER }}}

#### Summary

| Step                   | Result                | Icon                |
| ---------------------- | --------------------- | ------------------- |
| Instantiate repository | {{ CI_STATUS_REPO }}  | {{ CI_ICON_REPO }}  |
| Install dependencies   | {{ CI_STATUS_DEPS }}  | {{ CI_ICON_DEPS }}  |
| Run Core unit tests    | {{ CI_STATUS_UCORE }} | {{ CI_ICON_UCORE }} |
| Run API unit tests     | {{ CI_STATUS_UAPI }}  | {{ CI_ICON_UAPI }}  |

{{{ CI_FOOTER }}}
{{{CI_ERROR_FOOTER}}}
