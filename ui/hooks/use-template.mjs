import mustache from 'mustache'

export const useTemplate = (data) => {
  const template = (input, replace) =>
    typeof input === 'undefined' ? input : mustache.render(input, { ...data, ...replace })

  return template
}
