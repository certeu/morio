import Joi from 'joi'

/*
 * Metadata
 *
 * This holds the configuration wizard view settings for metadata
 */
export const metadata = () => ({
  about: `This is metadata that helps telling different configurations apart.`,
  title: 'Metadata',
  type: 'info',
  children: {
    comment: {
      type: 'form',
      title: 'Comment',
      form: [
        'Think of a comment as a commit message. Mention what was changed, and why you made the changes.',
        {
          schema: Joi.string().required(),
          label: 'Comment',
          placeholder: `Write your comment here`,
          textarea: false,
          key: 'metadata.comment',
        },
      ],
    },
  },
})
