/**
 * [{id: 1, name: hello}, {id: 1, name: world}, {id: 2, name: Jack}]
 * =>
 * {1: [{name: hello}, {name: world}], 2: {name: Jack}}
 * @param array
 * @param field
 */
export const extractField = (array: any[], field: string): TMapper => {
  let object: any = {}

  array.forEach(item => {
    const fieldValue = item[field]
    if (!(fieldValue in object)) {
      object[fieldValue] = []
    }

    delete item[field]

    object[fieldValue].push(item)
  })

  return object
}
